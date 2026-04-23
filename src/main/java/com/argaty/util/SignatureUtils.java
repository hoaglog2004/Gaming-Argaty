package com.argaty.util;

import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class SignatureUtils {

    private SignatureUtils() {
    }

    public static String hmacSha256(String secret, String data) {
        if (secret == null) {
            secret = "";
        }
        if (data == null) {
            data = "";
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo chữ ký HMAC", ex);
        }
    }

    public static String canonicalPayload(Map<String, String> payload, Set<String> excludedKeys) {
        if (payload == null || payload.isEmpty()) {
            return "";
        }

        return payload.entrySet().stream()
                .filter(e -> e.getKey() != null)
                .filter(e -> excludedKeys == null || !excludedKeys.contains(e.getKey()))
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(e -> e.getKey() + "=" + (e.getValue() == null ? "" : e.getValue()))
                .collect(Collectors.joining("&"));
    }
}
