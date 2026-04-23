package com.argaty.dto.response;

import java.time.LocalDateTime;

import com.argaty.enums.PaymentMethod;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentSessionResponse {

    private String orderCode;
    private PaymentMethod paymentMethod;
    private String providerCode;
    private String paymentUrl;
    private String qrImageUrl;
    private String qrContent;
    private String transactionRef;
    private LocalDateTime expiresAt;
    private String message;
}
