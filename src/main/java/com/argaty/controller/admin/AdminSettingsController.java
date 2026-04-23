package com.argaty.controller.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.SettingsResponse;
import com.argaty.service.SystemSettingsService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final SystemSettingsService settingsService;

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<SettingsResponse>> settings() {
        // Load settings from database
        SettingsResponse settings = SettingsResponse.builder()
                .storeName(settingsService.getSetting("store.name", "Argaty - Gaming Gear"))
                .contactEmail(settingsService.getSetting("contact.email", "support@argaty.com"))
                .contactPhone(settingsService.getSetting("contact.phone", "1900 123 456"))
                .address(settingsService.getSetting("store.address", ""))
                .seoDescription(settingsService.getSetting("seo.description", ""))
                .defaultShippingFee(settingsService.getDecimalSetting("shipping.default_fee", BigDecimal.valueOf(30000)))
                .freeShippingThreshold(settingsService.getDecimalSetting("shipping.free_threshold", BigDecimal.valueOf(500000)))
                .estimatedDeliveryDays(settingsService.getIntSetting("shipping.delivery_days", 3))
                .codEnabled(settingsService.getBooleanSetting("payment.cod_enabled", true))
                .onlinePaymentEnabled(settingsService.getBooleanSetting("payment.online_enabled", true))
                .smtpHost(settingsService.getSetting("email.smtp_host", ""))
                .smtpPort(settingsService.getIntSetting("email.smtp_port", 587))
                .smtpUsername(settingsService.getSetting("email.smtp_username", ""))
                .smtpTls(settingsService.getBooleanSetting("email.smtp_tls", true))
                .build();

        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    public static class GeneralSettingsRequest {
        public String storeName;
        public String contactEmail;
        public String contactPhone;
        public String address;
        public String seoDescription;
    }

    public static class ShippingSettingsRequest {
        public BigDecimal defaultShippingFee;
        public BigDecimal freeShippingThreshold;
        public Integer estimatedDeliveryDays;
    }

    public static class PaymentSettingsRequest {
        public Boolean codEnabled;
        public Boolean onlinePaymentEnabled;
    }

    public static class EmailSettingsRequest {
        public String smtpHost;
        public Integer smtpPort;
        public String smtpUsername;
        public String smtpPassword;
        public Boolean smtpTls;
    }

    @PatchMapping("/settings/general")
    public ResponseEntity<ApiResponse<Void>> updateGeneralSettings(@RequestBody GeneralSettingsRequest request) {

        try {
            Map<String, String> settings = new HashMap<>();
            settings.put("store.name", request.storeName);
            settings.put("contact.email", request.contactEmail);
            settings.put("contact.phone", request.contactPhone);
            settings.put("store.address", request.address);
            settings.put("seo.description", request.seoDescription);
            
            settingsService.updateSettings(settings, "general");
            return ResponseEntity.ok(ApiResponse.success("Cập nhật cài đặt chung thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PatchMapping("/settings/shipping")
    public ResponseEntity<ApiResponse<Void>> updateShippingSettings(@RequestBody ShippingSettingsRequest request) {

        try {
            Map<String, String> settings = new HashMap<>();
            settings.put("shipping.default_fee", request.defaultShippingFee.toString());
            settings.put("shipping.free_threshold", request.freeShippingThreshold.toString());
            settings.put("shipping.delivery_days", request.estimatedDeliveryDays.toString());
            
            settingsService.updateSettings(settings, "shipping");
            return ResponseEntity.ok(ApiResponse.success("Cập nhật cài đặt vận chuyển thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PatchMapping("/settings/payment")
    public ResponseEntity<ApiResponse<Void>> updatePaymentSettings(@RequestBody PaymentSettingsRequest request) {

        try {
            Map<String, String> settings = new HashMap<>();
            settings.put("payment.cod_enabled", String.valueOf(Boolean.TRUE.equals(request.codEnabled)));
            settings.put("payment.online_enabled", String.valueOf(Boolean.TRUE.equals(request.onlinePaymentEnabled)));
            
            settingsService.updateSettings(settings, "payment");
            return ResponseEntity.ok(ApiResponse.success("Cập nhật cài đặt thanh toán thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PatchMapping("/settings/email")
    public ResponseEntity<ApiResponse<Void>> updateEmailSettings(@RequestBody EmailSettingsRequest request) {

        try {
            Map<String, String> settings = new HashMap<>();
            settings.put("email.smtp_host", request.smtpHost);
            settings.put("email.smtp_port", request.smtpPort.toString());
            settings.put("email.smtp_username", request.smtpUsername);
            if (request.smtpPassword != null && !request.smtpPassword.trim().isEmpty()) {
                settings.put("email.smtp_password", request.smtpPassword);
            }
            settings.put("email.smtp_tls", String.valueOf(Boolean.TRUE.equals(request.smtpTls)));
            
            settingsService.updateSettings(settings, "email");
            return ResponseEntity.ok(ApiResponse.success("Cập nhật cài đặt email thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }
}
