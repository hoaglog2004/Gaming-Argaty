package com.argaty.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * Custom Application Properties
 * Đọc các config từ application.properties với prefix "app"
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Upload upload = new Upload();
    private Pagination pagination = new Pagination();
    private Shipping shipping = new Shipping();
    private Review review = new Review();
    private Security security = new Security();
    private Payment payment = new Payment();

    @Data
    public static class Upload {
        private String dir = "uploads/";
        private String productImages = "uploads/products/";
        private String userAvatars = "uploads/avatars/";
        private String banners = "uploads/banners/";
        private String reviews = "uploads/reviews/";
    }

    @Data
    public static class Pagination {
        private int productsPerPage = 12;
        private int ordersPerPage = 10;
        private int reviewsPerPage = 5;
    }

    @Data
    public static class Shipping {
        private long defaultFee = 30000;
        private long freeThreshold = 500000;
        private String primaryProvider = "JNT";
        private int quoteCacheMinutes = 5;
        private int defaultDeliveryDays = 3;
        private Ghn ghn = new Ghn();
        private Jnt jnt = new Jnt();

        @Data
        public static class Ghn {
            private boolean enabled = false;
            private String apiUrl = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2";
            private String token;
            private String shopId;
            private String originCity = "Da Nang";
            private String originDistrict = "Thanh Khe";
            private int defaultWeightGram = 1000;
            private int connectTimeoutMs = 5000;
            private int readTimeoutMs = 7000;
        }

        @Data
        public static class Jnt {
            private boolean enabled = false;
            private String rateEndpoint;
            private String uatRateEndpoint;
            private String productionRateEndpoint;
            private boolean useProduction = false;
            private String apiKeyHeader = "X-API-Key";
            private String apiKey;
            private String apiAccount;
            private String privateKey;
            private String customerCode;
            private String originCity = "Ho Chi Minh";
            private String originDistrict = "Quan 1";
            private int defaultWeightGram = 1000;
            private int connectTimeoutMs = 5000;
            private int readTimeoutMs = 7000;
            private boolean fallbackOnError = true;
        }
    }

    @Data
    public static class Review {
        private boolean allowWithoutPurchase = false;
    }

    @Data
    public static class Security {
        private int passwordResetTokenExpiry = 30;
        private int emailVerifyTokenExpiry = 1440;
    }

    @Data
    public static class Payment {
        private int sessionExpireMinutes = 15;
        private Bank bank = new Bank();
        private Momo momo = new Momo();
        private ZaloPay zalopay = new ZaloPay();

        @Data
        public static class Bank {
            private boolean enabled = true;
            private String bankCode = "MBBANK";
            private String accountNo;
            private String accountName;
        }

        @Data
        public static class Momo {
            private boolean enabled = false;
            private String payUrl;
            private String partnerCode = "MOMO";
            private String accessKey;
            private String callbackPath = "/api/payments/callback/momo";
            private String redirectPath = "/checkout/payment";
            private String requestType = "captureWallet";
            private String secretKey;
        }

        @Data
        public static class ZaloPay {
            private boolean enabled = false;
            private String payUrl;
            private String appId;
            private String key1;
            private String callbackPath = "/api/payments/callback/zalopay";
            private String redirectPath = "/checkout/payment";
            private String key2;
        }
    }
}