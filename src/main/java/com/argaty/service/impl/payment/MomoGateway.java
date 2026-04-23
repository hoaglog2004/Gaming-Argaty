package com.argaty.service.impl.payment;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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
public class MomoGateway implements PaymentGateway {

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.MOMO;
    }

    @Override
    public PaymentSessionResponse createPaymentSession(Order order, String baseUrl) {
        AppProperties.Payment.Momo momo = appProperties.getPayment().getMomo();
        if (!momo.isEnabled()) {
            throw new IllegalStateException("MoMo hiện đang tắt");
        }

        String txRef = "MOMO-" + order.getOrderCode() + "-" + System.currentTimeMillis();
        String callbackUrl = buildAbsolute(baseUrl, momo.getCallbackPath());

        if (looksLikeCreateApi(momo.getPayUrl())) {
            try {
                return createViaMomoCreateApi(order, baseUrl, momo, txRef, callbackUrl);
            } catch (Exception ex) {
                String fallbackUrl = buildMockPaymentUrl(order, baseUrl, txRef, momo.getSecretKey());
                return PaymentSessionResponse.builder()
                        .orderCode(order.getOrderCode())
                        .paymentMethod(getMethod())
                        .providerCode("MOMO")
                        .paymentUrl(fallbackUrl)
                        .qrImageUrl(buildQrImageFromValue(fallbackUrl))
                        .qrContent(fallbackUrl)
                        .transactionRef(txRef)
                        .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                        .message("Không tạo được phiên MoMo realtime, đã chuyển sang luồng mô phỏng")
                        .build();
            }
        }

        Map<String, String> payload = new HashMap<>();
        payload.put("orderCode", order.getOrderCode());
        payload.put("transactionRef", txRef);
        payload.put("amount", String.valueOf(order.getTotalAmount().longValue()));
        payload.put("resultCode", "0");
        payload.put("providerTransactionId", "MM" + System.currentTimeMillis());

        String signBase = SignatureUtils.canonicalPayload(payload, Set.of("signature"));
        String secret = momo.getSecretKey() != null ? momo.getSecretKey() : "";
        String signature = SignatureUtils.hmacSha256(secret, signBase);

        String paymentUrl;
        if (StringUtils.hasText(momo.getPayUrl())) {
            paymentUrl = momo.getPayUrl().trim() + "?orderCode=" + encode(order.getOrderCode())
                    + "&amount=" + order.getTotalAmount().longValue()
                    + "&transactionRef=" + encode(txRef)
                    + "&callbackUrl=" + encode(callbackUrl)
                    + "&signature=" + encode(signature);
        } else {
            paymentUrl = buildMockPaymentUrl(order, baseUrl, txRef, secret);
        }

        return PaymentSessionResponse.builder()
                .orderCode(order.getOrderCode())
                .paymentMethod(getMethod())
                .providerCode("MOMO")
                .paymentUrl(paymentUrl)
                .qrImageUrl(buildQrImageFromValue(paymentUrl))
                .transactionRef(txRef)
                .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                .message("Mở link để thanh toán qua MoMo")
                .build();
    }

    private PaymentSessionResponse createViaMomoCreateApi(Order order,
                                                          String baseUrl,
                                                          AppProperties.Payment.Momo momo,
                                                          String txRef,
                                                          String callbackUrl) {
        String payUrl = requireText(momo.getPayUrl(), "Chưa cấu hình app.payment.momo.pay-url");
        String partnerCode = requireText(momo.getPartnerCode(), "Chưa cấu hình app.payment.momo.partner-code");
        String accessKey = requireText(momo.getAccessKey(), "Chưa cấu hình app.payment.momo.access-key");
        String secretKey = requireText(momo.getSecretKey(), "Chưa cấu hình app.payment.momo.secret-key");

        String amount = String.valueOf(order.getTotalAmount().longValue());
        String orderCode = order.getOrderCode();
        String requestId = txRef;
        String orderInfo = "Thanh toan don " + orderCode;
        String redirectUrl = buildRedirectUrl(baseUrl, momo.getRedirectPath(), orderCode);
        String ipnUrl = callbackUrl;
        String extraData = "";
        String requestType = StringUtils.hasText(momo.getRequestType())
                ? momo.getRequestType().trim()
                : "captureWallet";

        String signatureBase = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderCode
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = SignatureUtils.hmacSha256(secretKey, signatureBase);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("partnerCode", partnerCode);
        requestPayload.put("partnerName", "Argaty");
        requestPayload.put("storeId", "ArgatyStore");
        requestPayload.put("requestId", requestId);
        requestPayload.put("amount", amount);
        requestPayload.put("orderId", orderCode);
        requestPayload.put("orderInfo", orderInfo);
        requestPayload.put("redirectUrl", redirectUrl);
        requestPayload.put("ipnUrl", ipnUrl);
        requestPayload.put("lang", "vi");
        requestPayload.put("requestType", requestType);
        requestPayload.put("autoCapture", true);
        requestPayload.put("extraData", extraData);
        requestPayload.put("signature", signature);

        Map<String, Object> response = restClient.post()
                .uri(payUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});

        if (response == null || response.isEmpty()) {
            throw new IllegalStateException("MoMo trả về dữ liệu rỗng");
        }

        int resultCode = parseInt(response.get("resultCode"), -1);
        if (resultCode != 0) {
            String errorMessage = asString(response.get("message"));
            if (!StringUtils.hasText(errorMessage)) {
                errorMessage = "resultCode=" + resultCode;
            }
            throw new IllegalStateException("MoMo tạo giao dịch thất bại: " + errorMessage);
        }

        String paymentUrl = firstNonBlank(
                asString(response.get("payUrl")),
                asString(response.get("deeplink")),
                asString(response.get("deeplinkMiniApp"))
        );
        if (!StringUtils.hasText(paymentUrl)) {
            throw new IllegalStateException("MoMo không trả về payUrl/deeplink hợp lệ");
        }

        String qrRaw = firstNonBlank(asString(response.get("qrCodeUrl")), asString(response.get("deeplink")));
        String qrImageUrl = buildQrImageFromValue(qrRaw);
        if (!StringUtils.hasText(qrImageUrl)) {
            qrImageUrl = buildQrImageFromValue(paymentUrl);
        }

        return PaymentSessionResponse.builder()
                .orderCode(orderCode)
                .paymentMethod(getMethod())
                .providerCode("MOMO")
                .paymentUrl(paymentUrl)
                .qrImageUrl(qrImageUrl)
                .qrContent(qrRaw)
                .transactionRef(txRef)
                .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                .message("Mở link hoặc quét QR để thanh toán qua MoMo")
                .build();
    }

    @Override
    public PaymentCallbackResult verifyCallback(Map<String, String> payload, String rawPayload) {
        String signature = payload.getOrDefault("signature", "");
        String secret = appProperties.getPayment().getMomo().getSecretKey();

        boolean signatureValid;
        if (!StringUtils.hasText(secret)) {
            signatureValid = true;
        } else {
            String canonical = SignatureUtils.canonicalPayload(payload, Set.of("signature"));
            String expected = SignatureUtils.hmacSha256(secret, canonical);
            signatureValid = expected.equalsIgnoreCase(signature);
        }

        String resultCode = payload.getOrDefault("resultCode", payload.getOrDefault("status", "-1"));
        boolean paid = "0".equals(resultCode) || "00".equals(resultCode);

        return PaymentCallbackResult.builder()
                .success(signatureValid)
                .paid(paid)
                .signatureValid(signatureValid)
                .orderCode(firstNonBlank(payload.get("orderCode"), payload.get("orderId")))
                .transactionRef(firstNonBlank(payload.get("transactionRef"), payload.get("orderId")))
                .providerTransactionId(firstNonBlank(payload.get("providerTransactionId"), payload.get("transId")))
                .message(paid ? "MoMo callback thành công" : "MoMo callback thất bại")
                .build();
    }

    private String buildAbsolute(String baseUrl, String path) {
        if (!StringUtils.hasText(path)) {
            return baseUrl + "/api/payments/callback/momo";
        }
        return path.startsWith("http") ? path : baseUrl + path;
    }

    private String buildRedirectUrl(String baseUrl, String redirectPath, String orderCode) {
        String path = StringUtils.hasText(redirectPath) ? redirectPath.trim() : "/checkout/payment";
        String redirectUrl = path.startsWith("http") ? path : baseUrl + path;
        String separator = redirectUrl.contains("?") ? "&" : "?";
        return redirectUrl + separator + "orderCode=" + encode(orderCode);
    }

    private String buildMockPaymentUrl(Order order, String baseUrl, String txRef, String secret) {
        Map<String, String> payload = new HashMap<>();
        payload.put("orderCode", order.getOrderCode());
        payload.put("transactionRef", txRef);
        payload.put("amount", String.valueOf(order.getTotalAmount().longValue()));
        payload.put("resultCode", "0");
        payload.put("providerTransactionId", "MM" + System.currentTimeMillis());

        String signBase = SignatureUtils.canonicalPayload(payload, Set.of("signature"));
        String signature = SignatureUtils.hmacSha256(secret != null ? secret : "", signBase);

        return baseUrl + "/api/payments/mock/complete?gateway=MOMO"
                + "&orderCode=" + encode(order.getOrderCode())
                + "&transactionRef=" + encode(txRef)
                + "&providerTransactionId=" + encode(payload.get("providerTransactionId"))
                + "&amount=" + order.getTotalAmount().longValue()
                + "&resultCode=0"
                + "&signature=" + encode(signature);
    }

    private boolean looksLikeCreateApi(String payUrl) {
        if (!StringUtils.hasText(payUrl)) {
            return false;
        }
        String normalized = payUrl.toLowerCase();
        return normalized.contains("/v2/gateway/api/create");
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
