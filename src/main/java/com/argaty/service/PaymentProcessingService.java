package com.argaty.service;

import java.util.Map;

import com.argaty.dto.response.PaymentCallbackResult;
import com.argaty.dto.response.PaymentSessionResponse;
import com.argaty.entity.Order;
import com.argaty.enums.PaymentMethod;

public interface PaymentProcessingService {

    PaymentSessionResponse createPaymentSession(String orderCode, Long userId, String baseUrl);

    PaymentCallbackResult processCallback(PaymentMethod method, Map<String, String> payload, String rawPayload);

    Order confirmBankTransfer(String orderCode, Long userId);

    boolean isOrderPaid(String orderCode, Long userId);
}
