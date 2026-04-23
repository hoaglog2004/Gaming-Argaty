package com.argaty.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShippingQuoteResponse {

    private BigDecimal shippingFee;
    private String providerCode;
    private String providerName;
    private String quoteId;
    private LocalDate estimatedDeliveryDate;
    private boolean fromCache;
    private boolean fallback;
    private String message;
}
