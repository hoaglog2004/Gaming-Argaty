package com.argaty.service.impl;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.argaty.config.AppProperties;
import com.argaty.dto.request.ShippingQuoteRequest;
import com.argaty.dto.response.ShippingQuoteResponse;
import com.argaty.service.ShippingProviderClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class GhnShippingProviderClient implements ShippingProviderClient {

    private static final Pattern DIACRITICAL = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private final AppProperties appProperties;

    private final Map<String, Integer> provinceIdByNameCache = new ConcurrentHashMap<>();
    private final Map<String, Integer> districtIdByNameCache = new ConcurrentHashMap<>();
    private final Map<String, String> wardCodeByNameCache = new ConcurrentHashMap<>();

    @Override
    public String getProviderCode() {
        return "GHN";
    }

    @Override
    public String getProviderName() {
        return "Giao Hang Nhanh";
    }

    @Override
    public boolean isAvailable() {
        AppProperties.Shipping.Ghn ghn = appProperties.getShipping().getGhn();
        return ghn.isEnabled()
                && StringUtils.hasText(ghn.getApiUrl())
                && StringUtils.hasText(ghn.getToken())
                && parseShopId(ghn.getShopId()) != null;
    }

    @Override
    public ShippingQuoteResponse quote(ShippingQuoteRequest request) {
        AppProperties.Shipping.Ghn ghn = appProperties.getShipping().getGhn();
        if (!isAvailable()) {
            throw new IllegalStateException("GHN provider chưa được bật hoặc thiếu cấu hình token/shop-id/api-url");
        }
        Integer shopId = parseShopId(ghn.getShopId());
        if (shopId == null) {
            throw new IllegalStateException("GHN shop-id không hợp lệ");
        }

        RestClient client = buildClient(ghn);
        String masterDataBaseUrl = resolveMasterDataBaseUrl(ghn.getApiUrl());

        int fromDistrictId = findDistrictId(client, ghn.getToken(), masterDataBaseUrl, ghn.getOriginCity(), ghn.getOriginDistrict());
        int toDistrictId = findDistrictId(client, ghn.getToken(), masterDataBaseUrl, request.getCity(), request.getDistrict());
        String toWardCode = findWardCode(client, ghn.getToken(), masterDataBaseUrl, toDistrictId, request.getWard());

        int serviceId = findServiceId(client, ghn, shopId, fromDistrictId, toDistrictId);
        BigDecimal fee = findShippingFee(client, ghn, shopId, fromDistrictId, toDistrictId, toWardCode, serviceId, request);

        return ShippingQuoteResponse.builder()
                .shippingFee(fee.max(BigDecimal.ZERO))
                .providerCode(getProviderCode())
                .providerName(getProviderName())
                .quoteId("GHN-" + UUID.randomUUID().toString().replace("-", ""))
                .estimatedDeliveryDate(LocalDate.now().plusDays(appProperties.getShipping().getDefaultDeliveryDays()))
                .fallback(false)
                .fromCache(false)
                .build();
    }

    private RestClient buildClient(AppProperties.Shipping.Ghn ghn) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(ghn.getConnectTimeoutMs());
        factory.setReadTimeout(ghn.getReadTimeoutMs());
        return RestClient.builder().requestFactory(factory).build();
    }

    private int findDistrictId(RestClient client, String token, String apiUrl, String cityName, String districtName) {
        String cacheKey = normalize(cityName) + "|" + normalize(districtName);
        Integer cached = districtIdByNameCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        int provinceId = findProvinceId(client, token, apiUrl, cityName);

        Map<String, Object> response = postJson(client, apiUrl + "/master-data/district", token, null,
                Map.of("province_id", provinceId));

        List<Map<String, Object>> districts = asListOfMap(response.get("data"));
        String expected = normalize(districtName);

        Optional<Integer> districtId = districts.stream()
                .filter(d -> normalize(asString(d.get("DistrictName"))).contains(expected)
                        || expected.contains(normalize(asString(d.get("DistrictName"))))
                        || normalize(asString(d.get("DistrictName"))).equals(expected))
                .map(d -> asInteger(d.get("DistrictID")))
                .filter(v -> v != null)
                .findFirst();

        if (districtId.isEmpty()) {
            throw new IllegalStateException("Không map được quận/huyện GHN cho: " + cityName + " - " + districtName);
        }

        districtIdByNameCache.put(cacheKey, districtId.get());
        return districtId.get();
    }

    private int findProvinceId(RestClient client, String token, String apiUrl, String cityName) {
        String cacheKey = normalize(cityName);
        Integer cached = provinceIdByNameCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Map<String, Object> response = postJson(client, apiUrl + "/master-data/province", token, null, Map.of());
        List<Map<String, Object>> provinces = asListOfMap(response.get("data"));
        String expected = normalize(cityName);

        Optional<Integer> provinceId = provinces.stream()
                .filter(p -> normalize(asString(p.get("ProvinceName"))).contains(expected)
                        || expected.contains(normalize(asString(p.get("ProvinceName"))))
                        || normalize(asString(p.get("ProvinceName"))).equals(expected))
                .map(p -> asInteger(p.get("ProvinceID")))
                .filter(v -> v != null)
                .findFirst();

        if (provinceId.isEmpty()) {
            throw new IllegalStateException("Không map được tỉnh/thành GHN cho: " + cityName);
        }

        provinceIdByNameCache.put(cacheKey, provinceId.get());
        return provinceId.get();
    }

    private String findWardCode(RestClient client, String token, String apiUrl, int districtId, String wardName) {
        if (!StringUtils.hasText(wardName)) {
            return null;
        }

        String cacheKey = districtId + "|" + normalize(wardName);
        String cached = wardCodeByNameCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Map<String, Object> response = postJson(client, apiUrl + "/master-data/ward", token, null,
                Map.of("district_id", districtId));

        List<Map<String, Object>> wards = asListOfMap(response.get("data"));
        String expected = normalize(wardName);

        Optional<String> wardCode = wards.stream()
                .filter(w -> normalize(asString(w.get("WardName"))).contains(expected)
                        || expected.contains(normalize(asString(w.get("WardName"))))
                        || normalize(asString(w.get("WardName"))).equals(expected))
                .map(w -> asString(w.get("WardCode")))
                .filter(StringUtils::hasText)
                .findFirst();

        if (wardCode.isEmpty()) {
            return null;
        }

        wardCodeByNameCache.put(cacheKey, wardCode.get());
        return wardCode.get();
    }

        private int findServiceId(RestClient client,
                      AppProperties.Shipping.Ghn ghn,
                      int shopId,
                      int fromDistrictId,
                      int toDistrictId) {
        Map<String, Object> response = postJson(
                client,
                ghn.getApiUrl() + "/shipping-order/available-services",
                ghn.getToken(),
            shopId,
                Map.of(
                "shop_id", shopId,
                        "from_district", fromDistrictId,
                        "to_district", toDistrictId
                )
        );

        List<Map<String, Object>> services = asListOfMap(response.get("data"));
        Optional<Integer> serviceId = services.stream()
                .map(s -> asInteger(s.get("service_id")))
                .filter(v -> v != null)
                .findFirst();

        if (serviceId.isEmpty()) {
            throw new IllegalStateException("GHN không trả về service khả dụng cho tuyến giao hàng này");
        }

        return serviceId.get();
    }

    private BigDecimal findShippingFee(RestClient client,
                                       AppProperties.Shipping.Ghn ghn,
                                       int shopId,
                                       int fromDistrictId,
                                       int toDistrictId,
                                       String toWardCode,
                                       int serviceId,
                                       ShippingQuoteRequest request) {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("service_id", serviceId);
        payload.put("insurance_value", request.getSubtotal().max(BigDecimal.ZERO).longValue());
        payload.put("coupon", null);
        payload.put("from_district_id", fromDistrictId);
        payload.put("to_district_id", toDistrictId);
        if (StringUtils.hasText(toWardCode)) {
            payload.put("to_ward_code", toWardCode);
        }
        payload.put("height", 10);
        payload.put("length", 20);
        payload.put("weight", Math.max(ghn.getDefaultWeightGram(), 100));
        payload.put("width", 15);

        Map<String, Object> response = postJson(
                client,
                ghn.getApiUrl() + "/shipping-order/fee",
                ghn.getToken(),
                shopId,
                payload
        );

        Map<String, Object> data = asMap(response.get("data"));
        if (data == null) {
            throw new IllegalStateException("GHN fee response thiếu data");
        }

        Number fee = asNumber(data.get("total"));
        if (fee == null) {
            fee = asNumber(data.get("service_fee"));
        }
        if (fee == null) {
            throw new IllegalStateException("GHN fee response không có trường total/service_fee");
        }

        return BigDecimal.valueOf(fee.longValue());
    }

    private Map<String, Object> postJson(RestClient client,
                                         String url,
                                         String token,
                                         Integer shopId,
                                         Map<String, Object> payload) {
        RestClient.RequestBodySpec req = client.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .header("Token", token);

        if (shopId != null) {
            req = req.header("ShopId", String.valueOf(shopId));
        }

        Map<String, Object> response = req.body(payload != null ? payload : Map.of())
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});

        if (response == null || response.isEmpty()) {
            throw new IllegalStateException("GHN response rỗng từ endpoint: " + url);
        }

        return response;
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalized = Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return DIACRITICAL.matcher(normalized).replaceAll("")
                .replace("đ", "d")
                .replaceAll("\\s+", " ");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asListOfMap(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .toList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            return null;
        }
        return (Map<String, Object>) map;
    }

    private Integer asInteger(Object value) {
        Number number = asNumber(value);
        return number == null ? null : number.intValue();
    }

    private Number asNumber(Object value) {
        if (value instanceof Number number) {
            return number;
        }
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Integer parseShopId(String shopId) {
        if (!StringUtils.hasText(shopId)) {
            return null;
        }
        try {
            return Integer.parseInt(shopId.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String resolveMasterDataBaseUrl(String apiUrl) {
        if (!StringUtils.hasText(apiUrl)) {
            return "";
        }
        String normalized = apiUrl.trim();
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        if (normalized.endsWith("/v2")) {
            return normalized.substring(0, normalized.length() - 3);
        }
        return normalized;
    }
}
