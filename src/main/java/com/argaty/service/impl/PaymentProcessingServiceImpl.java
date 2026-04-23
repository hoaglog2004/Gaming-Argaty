package com.argaty.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.argaty.dto.response.PaymentCallbackResult;
import com.argaty.dto.response.PaymentSessionResponse;
import com.argaty.entity.Order;
import com.argaty.entity.PaymentTransaction;
import com.argaty.enums.PaymentMethod;
import com.argaty.enums.PaymentStatus;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.repository.OrderRepository;
import com.argaty.repository.PaymentTransactionRepository;
import com.argaty.service.OrderService;
import com.argaty.service.PaymentGateway;
import com.argaty.service.PaymentProcessingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentProcessingServiceImpl implements PaymentProcessingService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final List<PaymentGateway> gateways;

    @Override
    public PaymentSessionResponse createPaymentSession(String orderCode, Long userId, String baseUrl) {
        Order order = orderRepository.findByOrderCodeAndUserId(orderCode, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));

        if (Boolean.TRUE.equals(order.getIsPaid())) {
            return PaymentSessionResponse.builder()
                    .orderCode(order.getOrderCode())
                    .paymentMethod(order.getPaymentMethod())
                    .providerCode(order.getPaymentMethod().name())
                    .transactionRef(order.getPaymentRef())
                    .message("Đơn hàng đã thanh toán")
                    .build();
        }

        PaymentGateway gateway = findGateway(order.getPaymentMethod());
        if (gateway == null) {
            throw new BadRequestException("Phương thức thanh toán chưa được hỗ trợ: " + order.getPaymentMethod());
        }

        PaymentSessionResponse session = gateway.createPaymentSession(order, baseUrl);

        if (StringUtils.hasText(session.getTransactionRef())) {
            order.setPaymentRef(session.getTransactionRef());
        }
        order.setPaymentStatus(PaymentStatus.PENDING);
        orderRepository.save(order);

        upsertTransaction(
                order,
                order.getPaymentMethod(),
                session.getProviderCode(),
                session.getTransactionRef(),
                null,
                PaymentStatus.PENDING,
                false,
                toJson(session),
                null
        );

        return session;
    }

    @Override
    public PaymentCallbackResult processCallback(PaymentMethod method, Map<String, String> payload, String rawPayload) {
        PaymentGateway gateway = findGateway(method);
        if (gateway == null) {
            return PaymentCallbackResult.builder()
                    .success(false)
                    .paid(false)
                    .signatureValid(false)
                    .message("Gateway không được hỗ trợ")
                    .build();
        }

        PaymentCallbackResult verified = gateway.verifyCallback(payload, rawPayload);
        String orderCode = firstNonBlank(
                verified.getOrderCode(),
                payload.get("orderCode"),
                payload.get("orderId"),
                payload.get("app_trans_id")
        );

        if (!StringUtils.hasText(orderCode)) {
            return PaymentCallbackResult.builder()
                    .success(false)
                    .paid(false)
                    .signatureValid(verified.isSignatureValid())
                    .message("Thiếu orderCode trong callback")
                    .build();
        }

        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));

        String transactionRef = firstNonBlank(
                verified.getTransactionRef(),
                payload.get("transactionRef"),
                order.getPaymentRef()
        );
        String providerTransactionId = firstNonBlank(
                verified.getProviderTransactionId(),
                payload.get("providerTransactionId"),
                payload.get("transId"),
                payload.get("zp_trans_id")
        );

        PaymentStatus callbackStatus = (verified.isSignatureValid() && verified.isPaid())
                ? PaymentStatus.PAID
                : PaymentStatus.FAILED;

        upsertTransaction(
                order,
                method,
                method.name(),
                transactionRef,
                providerTransactionId,
                callbackStatus,
                verified.isSignatureValid(),
                toJson(payload),
                rawPayload
        );

        if (verified.isSignatureValid() && verified.isPaid()) {
            if (!Boolean.TRUE.equals(order.getIsPaid())) {
                String tx = StringUtils.hasText(providerTransactionId) ? providerTransactionId : transactionRef;
                orderService.updatePaymentStatus(order.getId(), true, tx);
            }

            order.setPaymentStatus(PaymentStatus.PAID);
            if (StringUtils.hasText(transactionRef)) {
                order.setPaymentRef(transactionRef);
            }
            orderRepository.save(order);

            return PaymentCallbackResult.builder()
                    .success(true)
                    .paid(true)
                    .signatureValid(true)
                    .orderCode(orderCode)
                    .transactionRef(transactionRef)
                    .providerTransactionId(providerTransactionId)
                    .message("Xử lý callback thành công")
                    .build();
        }

        if (!Boolean.TRUE.equals(order.getIsPaid())) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            if (StringUtils.hasText(transactionRef)) {
                order.setPaymentRef(transactionRef);
            }
            orderRepository.save(order);
        }

        return PaymentCallbackResult.builder()
                .success(false)
                .paid(false)
                .signatureValid(verified.isSignatureValid())
                .orderCode(orderCode)
                .transactionRef(transactionRef)
                .providerTransactionId(providerTransactionId)
                .message(verified.getMessage() != null ? verified.getMessage() : "Callback không hợp lệ")
                .build();
    }

    @Override
    public Order confirmBankTransfer(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCodeAndUserId(orderCode, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));

        if (order.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new BadRequestException("Đơn hàng này không dùng chuyển khoản ngân hàng");
        }

        if (Boolean.TRUE.equals(order.getIsPaid())) {
            return order;
        }

        String tx = "BANK-MANUAL-" + System.currentTimeMillis();
        Order updated = orderService.updatePaymentStatus(order.getId(), true, tx);
        updated.setPaymentStatus(PaymentStatus.PAID);
        if (!StringUtils.hasText(updated.getPaymentRef())) {
            updated.setPaymentRef(tx);
        }
        updated = orderRepository.save(updated);

        upsertTransaction(
                updated,
                PaymentMethod.BANK_TRANSFER,
                "BANK_QR",
                updated.getPaymentRef(),
                tx,
                PaymentStatus.PAID,
                true,
                "{\"manualConfirm\":true}",
                null
        );

        return updated;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isOrderPaid(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCodeAndUserId(orderCode, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));
        return Boolean.TRUE.equals(order.getIsPaid());
    }

    private PaymentGateway findGateway(PaymentMethod method) {
        return gateways.stream()
                .filter(g -> g.getMethod() == method)
                .findFirst()
                .orElse(null);
    }

    private void upsertTransaction(Order order,
                                   PaymentMethod method,
                                   String gatewayCode,
                                   String transactionRef,
                                   String providerTransactionId,
                                   PaymentStatus status,
                                   boolean signatureVerified,
                                   String requestPayload,
                                   String responsePayload) {
        PaymentTransaction tx = null;

        if (StringUtils.hasText(providerTransactionId) && StringUtils.hasText(gatewayCode)) {
            tx = paymentTransactionRepository
                    .findByGatewayCodeAndProviderTransactionId(gatewayCode, providerTransactionId)
                    .orElse(null);
        }

        if (tx == null && StringUtils.hasText(transactionRef)) {
            tx = paymentTransactionRepository.findByTransactionRef(transactionRef).orElse(null);
        }

        if (tx == null) {
            tx = PaymentTransaction.builder()
                    .order(order)
                    .paymentMethod(method)
                    .gatewayCode(gatewayCode != null ? gatewayCode : method.name())
                    .transactionRef(transactionRef)
                    .build();
        }

        tx.setOrder(order);
        tx.setPaymentMethod(method);
        if (StringUtils.hasText(gatewayCode)) {
            tx.setGatewayCode(gatewayCode);
        }
        if (StringUtils.hasText(transactionRef)) {
            tx.setTransactionRef(transactionRef);
        }
        if (StringUtils.hasText(providerTransactionId)) {
            tx.setProviderTransactionId(providerTransactionId);
        }
        tx.setStatus(status);
        tx.setSignatureVerified(signatureVerified);
        if (StringUtils.hasText(requestPayload)) {
            tx.setRequestPayload(requestPayload);
        }
        if (StringUtils.hasText(responsePayload)) {
            tx.setResponsePayload(responsePayload);
        }
        tx.setCallbackAt(LocalDateTime.now());

        paymentTransactionRepository.save(tx);
    }

    private String toJson(Object source) {
        if (source == null) {
            return null;
        }
        return String.valueOf(source);
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
}
