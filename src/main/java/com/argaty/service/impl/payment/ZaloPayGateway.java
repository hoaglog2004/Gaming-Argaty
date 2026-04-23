package com.argaty.service.impl.payment;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.argaty.config.AppProperties;
import com.argaty.dto.response.PaymentCallbackResult;
import com.argaty.dto.response.PaymentSessionResponse;
import com.argaty.entity.Order;
import com.argaty.enums.PaymentMethod;
import com.argaty.service.PaymentGateway;
import com.argaty.util.SignatureUtils;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ZaloPayGateway implements PaymentGateway {

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.ZALOPAY;
    }

    @Override
    public PaymentSessionResponse createPaymentSession(Order order, String baseUrl) {
        AppProperties.Payment.ZaloPay zaloPay = appProperties.getPayment().getZalopay();
        if (!zaloPay.isEnabled()) {
            throw new IllegalStateException("ZaloPay hiện đang tắt");
        }

        String txRef = "ZLP-" + order.getOrderCode() + "-" + System.currentTimeMillis();
        String callbackUrl = buildAbsolute(baseUrl, zaloPay.getCallbackPath());

        if (looksLikeCreateApi(zaloPay.getPayUrl())) {
            try {
                return createViaZaloPayCreateApi(order, baseUrl, zaloPay, txRef, callbackUrl);
            } catch (Exception ex) {
                String fallbackUrl = buildMockPaymentUrl(order, baseUrl, txRef, zaloPay.getKey2());
                return PaymentSessionResponse.builder()
                        .orderCode(order.getOrderCode())
                        .paymentMethod(getMethod())
                        .providerCode("ZALOPAY")
                        .paymentUrl(fallbackUrl)
                        .qrImageUrl(buildQrImageFromValue(fallbackUrl))
                        .qrContent(fallbackUrl)
                        .transactionRef(txRef)
                        .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                        .message("Không tạo được phiên ZaloPay realtime, đã chuyển sang luồng mô phỏng")
                        .build();
            }
        }

        Map<String, String> payload = new HashMap<>();
        payload.put("orderCode", order.getOrderCode());
        payload.put("transactionRef", txRef);
        payload.put("amount", String.valueOf(order.getTotalAmount().longValue()));
        payload.put("return_code", "1");
        payload.put("providerTransactionId", "ZP" + System.currentTimeMillis());

        String signBase = SignatureUtils.canonicalPayload(payload, Set.of("mac"));
        String key2 = zaloPay.getKey2() != null ? zaloPay.getKey2() : "";
        String mac = SignatureUtils.hmacSha256(key2, signBase);

        String paymentUrl;
        if (StringUtils.hasText(zaloPay.getPayUrl())) {
            paymentUrl = zaloPay.getPayUrl().trim() + "?orderCode=" + encode(order.getOrderCode())
                    + "&amount=" + order.getTotalAmount().longValue()
                    + "&transactionRef=" + encode(txRef)
                    + "&callbackUrl=" + encode(callbackUrl)
                    + "&mac=" + encode(mac);
        } else {
            paymentUrl = buildMockPaymentUrl(order, baseUrl, txRef, key2);
        }

        return PaymentSessionResponse.builder()
                .orderCode(order.getOrderCode())
                .paymentMethod(getMethod())
                .providerCode("ZALOPAY")
                .paymentUrl(paymentUrl)
                .qrImageUrl(buildQrImageFromValue(paymentUrl))
                .transactionRef(txRef)
                .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                .message("Mở link để thanh toán qua ZaloPay")
                .build();
    }

    private PaymentSessionResponse createViaZaloPayCreateApi(Order order,
                                                             String baseUrl,
                                                             AppProperties.Payment.ZaloPay zaloPay,
                                                             String txRef,
                                                             String callbackUrl) {
        String payUrl = requireText(zaloPay.getPayUrl(), "Chưa cấu hình app.payment.zalopay.pay-url");
        String appId = requireText(zaloPay.getAppId(), "Chưa cấu hình app.payment.zalopay.app-id");
        String key1 = requireText(zaloPay.getKey1(), "Chưa cấu hình app.payment.zalopay.key1");

        long appTime = System.currentTimeMillis();
        String appTransId = buildAppTransId(order.getOrderCode(), appTime);
        String amount = String.valueOf(order.getTotalAmount().longValue());
        String appUser = "argaty_user";
        String itemJson = "[]";
        String embedData = "{\"redirecturl\":\"" + buildRedirectUrl(baseUrl, zaloPay.getRedirectPath(), order.getOrderCode()) + "\"}";
        String description = "Thanh toan don " + order.getOrderCode();

        String dataToSign = appId + "|" + appTransId + "|" + appUser + "|"
                + amount + "|" + appTime + "|" + embedData + "|" + itemJson;
        String mac = SignatureUtils.hmacSha256(key1, dataToSign);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("app_id", Integer.parseInt(appId));
        requestPayload.put("app_user", appUser);
        requestPayload.put("app_time", appTime);
        requestPayload.put("amount", Long.parseLong(amount));
        requestPayload.put("app_trans_id", appTransId);
        requestPayload.put("embed_data", embedData);
        requestPayload.put("item", itemJson);
        requestPayload.put("description", description);
        requestPayload.put("callback_url", callbackUrl);
        requestPayload.put("mac", mac);

        Map<String, Object> response = restClient.post()
                .uri(payUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});

        if (response == null || response.isEmpty()) {
            throw new IllegalStateException("ZaloPay trả về dữ liệu rỗng");
        }

        int returnCode = parseInt(response.get("return_code"), -1);
        if (returnCode != 1) {
            String message = asString(response.get("return_message"));
            if (!StringUtils.hasText(message)) {
                message = "return_code=" + returnCode;
            }
            throw new IllegalStateException("ZaloPay tạo giao dịch thất bại: " + message);
        }

        String paymentUrl = firstNonBlank(
                asString(response.get("order_url")),
                asString(response.get("pay_url"))
        );
        if (!StringUtils.hasText(paymentUrl)) {
            throw new IllegalStateException("ZaloPay không trả về order_url hợp lệ");
        }

        String qrRaw = firstNonBlank(asString(response.get("qr_code")), paymentUrl);
        String qrImageUrl = buildQrImageFromValue(qrRaw);

        return PaymentSessionResponse.builder()
                .orderCode(order.getOrderCode())
                .paymentMethod(getMethod())
                .providerCode("ZALOPAY")
                .paymentUrl(paymentUrl)
                .qrImageUrl(qrImageUrl)
                .qrContent(qrRaw)
                .transactionRef(appTransId)
                .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                .message("Mở link hoặc quét QR để thanh toán qua ZaloPay")
                .build();
    }

    @Override
    public PaymentCallbackResult verifyCallback(Map<String, String> payload, String rawPayload) {
        String mac = payload.getOrDefault("mac", "");
        String key2 = appProperties.getPayment().getZalopay().getKey2();

        boolean signatureValid;
        if (!StringUtils.hasText(key2)) {
            signatureValid = true;
        } else {
            String canonical = SignatureUtils.canonicalPayload(payload, Set.of("mac"));
            String expected = SignatureUtils.hmacSha256(key2, canonical);
            signatureValid = expected.equalsIgnoreCase(mac);
        }

        String returnCode = payload.getOrDefault("return_code", payload.getOrDefault("status", "-1"));
        boolean paid = "1".equals(returnCode) || "0".equals(returnCode);

        return PaymentCallbackResult.builder()
                .success(signatureValid)
                .paid(paid)
                .signatureValid(signatureValid)
                .orderCode(firstNonBlank(payload.get("orderCode"), payload.get("app_trans_id")))
                .transactionRef(firstNonBlank(payload.get("transactionRef"), payload.get("app_trans_id")))
                .providerTransactionId(firstNonBlank(payload.get("providerTransactionId"), payload.get("zp_trans_id")))
                .message(paid ? "ZaloPay callback thành công" : "ZaloPay callback thất bại")
                .build();
    }

    private String buildAbsolute(String baseUrl, String path) {
        if (!StringUtils.hasText(path)) {
            return baseUrl + "/api/payments/callback/zalopay";
        }
        return path.startsWith("http") ? path : baseUrl + path;
    }

    private String buildRedirectUrl(String baseUrl, String redirectPath, String orderCode) {
        String path = StringUtils.hasText(redirectPath) ? redirectPath.trim() : "/checkout/payment";
        String redirectUrl = path.startsWith("http") ? path : baseUrl + path;
        String separator = redirectUrl.contains("?") ? "&" : "?";
        return redirectUrl + separator + "orderCode=" + encode(orderCode);
    }

    private String buildAppTransId(String orderCode, long appTime) {
        String day = LocalDateTime.ofEpochSecond(appTime / 1000, 0, ZoneOffset.UTC)
                .plusHours(7)
                .format(DateTimeFormatter.ofPattern("yyMMdd"));
        return day + "_" + orderCode;
    }

    private String buildMockPaymentUrl(Order order, String baseUrl, String txRef, String key2) {
        Map<String, String> payload = new HashMap<>();
        payload.put("orderCode", order.getOrderCode());
        payload.put("transactionRef", txRef);
        payload.put("amount", String.valueOf(order.getTotalAmount().longValue()));
        payload.put("return_code", "1");
        payload.put("providerTransactionId", "ZP" + System.currentTimeMillis());

        String signBase = SignatureUtils.canonicalPayload(payload, Set.of("mac"));
        String mac = SignatureUtils.hmacSha256(key2 != null ? key2 : "", signBase);

        return baseUrl + "/api/payments/mock/complete?gateway=ZALOPAY"
                + "&orderCode=" + encode(order.getOrderCode())
                + "&transactionRef=" + encode(txRef)
                + "&providerTransactionId=" + encode(payload.get("providerTransactionId"))
                + "&amount=" + order.getTotalAmount().longValue()
                + "&return_code=1"
                + "&mac=" + encode(mac);
    }

    private boolean looksLikeCreateApi(String payUrl) {
        if (!StringUtils.hasText(payUrl)) {
            return false;
        }
        return payUrl.toLowerCase().contains("/v2/create");
    }

    private String buildQrImageFromValue(String qrValue) {
        if (!StringUtils.hasText(qrValue)) {
            return null;
        }
        if (qrValue.startsWith("http://") || qrValue.startsWith("https://")) {
            if (qrValue.contains(".png") || qrValue.contains(".jpg") || qrValue.contains(".jpeg") || qrValue.contains(".webp")) {
                return qrValue;
            }
        }
        return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encode(qrValue);
    }

    private String requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
        return value.trim();
    }

    private int parseInt(Object value, int defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String normalized = String.valueOf(value).trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
