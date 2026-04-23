package com.argaty.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.argaty.config.AppProperties;
import com.argaty.dto.request.ShippingQuoteRequest;
import com.argaty.dto.response.ShippingQuoteResponse;
import com.argaty.service.ShippingProviderClient;
import com.argaty.service.ShippingQuoteService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShippingQuoteServiceImpl implements ShippingQuoteService {

    private final List<ShippingProviderClient> providerClients;
    private final AppProperties appProperties;

    private final Map<String, CacheEntry> quoteCache = new ConcurrentHashMap<>();

    @Override
    public ShippingQuoteResponse quote(ShippingQuoteRequest request) {
        ShippingQuoteRequest normalized = normalize(request);
        String key = buildCacheKey(normalized);

        CacheEntry cached = quoteCache.get(key);
        if (cached != null && cached.expiresAt.isAfter(LocalDateTime.now())) {
            return cached.quote.toBuilder().fromCache(true).build();
        }

        ShippingQuoteResponse quote;
        ShippingProviderClient selected = selectProvider();
        if (selected == null) {
            quote = fallbackQuote(normalized, "Không có provider vận chuyển khả dụng");
        } else {
            try {
                quote = selected.quote(normalized);
            } catch (Exception ex) {
                log.warn("Quote lỗi từ provider {}: {}", selected.getProviderCode(), ex.getMessage());
                quote = fallbackQuote(normalized, "Provider lỗi, dùng phí dự phòng");
            }
        }

        long ttl = Math.max(1, appProperties.getShipping().getQuoteCacheMinutes());
        quoteCache.put(key, new CacheEntry(quote, LocalDateTime.now().plusMinutes(ttl)));
        return quote;
    }

    private ShippingProviderClient selectProvider() {
        String primary = appProperties.getShipping().getPrimaryProvider();
        if (StringUtils.hasText(primary)) {
            String normalizedPrimary = primary.trim().toUpperCase(Locale.ROOT);
            for (ShippingProviderClient provider : providerClients) {
                if (provider.getProviderCode().toUpperCase(Locale.ROOT).equals(normalizedPrimary) && provider.isAvailable()) {
                    return provider;
                }
            }
        }

        for (ShippingProviderClient provider : providerClients) {
            if (provider.isAvailable()) {
                return provider;
            }
        }

        return null;
    }

    private ShippingQuoteResponse fallbackQuote(ShippingQuoteRequest request, String message) {
        AppProperties.Shipping shipping = appProperties.getShipping();
        BigDecimal fee = request.getSubtotal().compareTo(BigDecimal.valueOf(shipping.getFreeThreshold())) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(shipping.getDefaultFee());

        return ShippingQuoteResponse.builder()
                .shippingFee(fee)
                .providerCode("FALLBACK")
                .providerName("Fallback Shipping")
                .quoteId("FB-" + System.currentTimeMillis())
                .estimatedDeliveryDate(LocalDate.now().plusDays(shipping.getDefaultDeliveryDays()))
                .fallback(true)
                .fromCache(false)
                .message(message)
                .build();
    }

    private ShippingQuoteRequest normalize(ShippingQuoteRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Yêu cầu tính phí ship không hợp lệ");
        }

        BigDecimal subtotal = request.getSubtotal() != null ? request.getSubtotal().max(BigDecimal.ZERO) : BigDecimal.ZERO;
        int itemCount = request.getItemCount() != null ? Math.max(1, request.getItemCount()) : 1;

        return ShippingQuoteRequest.builder()
                .subtotal(subtotal)
                .itemCount(itemCount)
                .city(safe(request.getCity()))
                .district(safe(request.getDistrict()))
                .ward(safe(request.getWard()))
                .address(safe(request.getAddress()))
                .build();
    }

    private String buildCacheKey(ShippingQuoteRequest request) {
        return (request.getCity() + "|" + request.getDistrict() + "|" + request.getWard() + "|"
                + request.getAddress() + "|" + request.getItemCount() + "|" + request.getSubtotal())
                .toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static class CacheEntry {
        private final ShippingQuoteResponse quote;
        private final LocalDateTime expiresAt;

        private CacheEntry(ShippingQuoteResponse quote, LocalDateTime expiresAt) {
            this.quote = quote;
            this.expiresAt = expiresAt;
        }
    }
}
