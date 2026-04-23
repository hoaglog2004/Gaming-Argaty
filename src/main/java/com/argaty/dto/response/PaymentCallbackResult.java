package com.argaty.dto.response;

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
public class PaymentCallbackResult {

    private boolean success;
    private boolean paid;
    private boolean signatureValid;
    private String orderCode;
    private String transactionRef;
    private String providerTransactionId;
    private String message;
}
