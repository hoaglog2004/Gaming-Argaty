package com.argaty.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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
public class JntShippingProviderClient implements ShippingProviderClient {

    private static final List<String> FEE_FIELDS = List.of(
            "fee", "shippingFee", "freight", "totalFee", "service_fee", "shipFee",
            "totalFreight", "freightAmount", "shippingCost", "cost", "price", "amount"
    );

    private static final List<String> QUOTE_ID_FIELDS = List.of(
            "quoteId", "quotationNo", "quotationId", "orderNo", "refNo", "requestId"
    );

    private final AppProperties appProperties;

    @Override
    public String getProviderCode() {
        return "JNT";
    }

    @Override
    public String getProviderName() {
        return "J&T Express";
    }

    @Override
    public boolean isAvailable() {
        AppProperties.Shipping.Jnt jnt = appProperties.getShipping().getJnt();
        String endpoint = resolveEndpoint(jnt);
        return jnt.isEnabled() && StringUtils.hasText(endpoint);
    }

    @Override
    public ShippingQuoteResponse quote(ShippingQuoteRequest request) {
        AppProperties.Shipping.Jnt jnt = appProperties.getShipping().getJnt();
        String endpoint = resolveEndpoint(jnt);
        if (!jnt.isEnabled() || !StringUtils.hasText(endpoint)) {
            throw new IllegalStateException("J&T provider chưa được bật hoặc thiếu endpoint");
        }

        RestClient client = buildClient(jnt);
        MultiValueMap<String, String> payload = buildPayload(jnt, request);

        RestClient.RequestBodySpec req = client.post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON);

        if (StringUtils.hasText(jnt.getApiKey())) {
            req = req.header(jnt.getApiKeyHeader(), jnt.getApiKey());
        }
        if (StringUtils.hasText(jnt.getCustomerCode())) {
            req = req.header("X-Customer-Code", jnt.getCustomerCode());
        }

        String raw = req.body(payload).retrieve().body(String.class);

        BigDecimal fee = parseNumericField(raw, FEE_FIELDS)
                .orElseThrow(() -> new IllegalStateException("J&T response không có trường phí hợp lệ"));

        String quoteId = parseStringField(raw, QUOTE_ID_FIELDS)
                .orElse("JNT-" + UUID.randomUUID().toString().replace("-", ""));

        return ShippingQuoteResponse.builder()
                .shippingFee(fee.max(BigDecimal.ZERO))
                .providerCode(getProviderCode())
                .providerName(getProviderName())
                .quoteId(quoteId)
                .estimatedDeliveryDate(LocalDate.now().plusDays(appProperties.getShipping().getDefaultDeliveryDays()))
                .fallback(false)
                .fromCache(false)
                .build();
    }

    private RestClient buildClient(AppProperties.Shipping.Jnt jnt) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(jnt.getConnectTimeoutMs());
        factory.setReadTimeout(jnt.getReadTimeoutMs());
        return RestClient.builder().requestFactory(factory).build();
    }

    private MultiValueMap<String, String> buildPayload(AppProperties.Shipping.Jnt jnt, ShippingQuoteRequest request) {
        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        payload.add("apiAccount", safe(jnt.getApiAccount()));
        payload.add("privateKey", safe(jnt.getPrivateKey()));
        payload.add("originCity", safe(jnt.getOriginCity()));
        payload.add("originDistrict", safe(jnt.getOriginDistrict()));
        payload.add("destinationCity", safe(request.getCity()));
        payload.add("destinationDistrict", safe(request.getDistrict()));
        payload.add("destinationWard", safe(request.getWard()));
        payload.add("destinationAddress", safe(request.getAddress()));
        payload.add("weightGram", String.valueOf(jnt.getDefaultWeightGram()));
        payload.add("itemCount", String.valueOf(Math.max(1, request.getItemCount())));
        payload.add("codAmount", String.valueOf(request.getSubtotal().max(BigDecimal.ZERO)));
        payload.add("orderAmount", String.valueOf(request.getSubtotal().max(BigDecimal.ZERO)));

        payload.add("sendCity", safe(jnt.getOriginCity()));
        payload.add("sendDistrict", safe(jnt.getOriginDistrict()));
        payload.add("destCity", safe(request.getCity()));
        payload.add("destDistrict", safe(request.getDistrict()));
        payload.add("destArea", safe(request.getWard()));
        payload.add("destAddress", safe(request.getAddress()));
        payload.add("weight", String.valueOf(jnt.getDefaultWeightGram()));
        payload.add("pieces", String.valueOf(Math.max(1, request.getItemCount())));
        payload.add("goodsValue", String.valueOf(request.getSubtotal().max(BigDecimal.ZERO)));

        return payload;
    }

    private String resolveEndpoint(AppProperties.Shipping.Jnt jnt) {
        if (jnt.isUseProduction() && StringUtils.hasText(jnt.getProductionRateEndpoint())) {
            return jnt.getProductionRateEndpoint();
        }
        if (!jnt.isUseProduction() && StringUtils.hasText(jnt.getUatRateEndpoint())) {
            return jnt.getUatRateEndpoint();
        }
        return jnt.getRateEndpoint();
    }

    private Optional<BigDecimal> parseNumericField(String rawJson, List<String> keys) {
        if (!StringUtils.hasText(rawJson)) {
            return Optional.empty();
        }

        for (String key : keys) {
            Pattern keyPattern = Pattern.compile(
                    "\"" + Pattern.quote(key) + "\"\\s*:\\s*\"?([0-9]+(?:\\.[0-9]+)?)\"?",
                    Pattern.CASE_INSENSITIVE
            );
            Matcher matcher = keyPattern.matcher(rawJson);
            if (matcher.find()) {
                return Optional.of(new BigDecimal(matcher.group(1)));
            }
        }

        log.warn("J&T response không parse được phí ship: {}", rawJson);
        return Optional.empty();
    }

    private Optional<String> parseStringField(String rawJson, List<String> keys) {
        if (!StringUtils.hasText(rawJson)) {
            return Optional.empty();
        }

        for (String key : keys) {
            Pattern keyPattern = Pattern.compile(
                    "\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]+)\"",
                    Pattern.CASE_INSENSITIVE
            );
            Matcher matcher = keyPattern.matcher(rawJson);
            if (matcher.find()) {
                return Optional.of(matcher.group(1));
            }
        }

        return Optional.empty();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
