package com.argaty.service;

import java.util.Map;

import com.argaty.dto.response.PaymentCallbackResult;
import com.argaty.dto.response.PaymentSessionResponse;
import com.argaty.entity.Order;
import com.argaty.enums.PaymentMethod;

public interface PaymentGateway {

    PaymentMethod getMethod();

    PaymentSessionResponse createPaymentSession(Order order, String baseUrl);

    PaymentCallbackResult verifyCallback(Map<String, String> payload, String rawPayload);
}
