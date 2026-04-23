package com.argaty.service.impl.payment;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.argaty.config.AppProperties;
import com.argaty.dto.response.PaymentCallbackResult;
import com.argaty.dto.response.PaymentSessionResponse;
import com.argaty.entity.Order;
import com.argaty.enums.PaymentMethod;
import com.argaty.service.PaymentGateway;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BankTransferGateway implements PaymentGateway {

    private final AppProperties appProperties;

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.BANK_TRANSFER;
    }

    @Override
    public PaymentSessionResponse createPaymentSession(Order order, String baseUrl) {
        AppProperties.Payment.Bank bank = appProperties.getPayment().getBank();
        if (!bank.isEnabled()) {
            throw new IllegalStateException("Bank transfer hiện đang tắt");
        }

        String txRef = "BANK-" + order.getOrderCode() + "-" + System.currentTimeMillis();
        String addInfo = "ARGATY " + order.getOrderCode();

        String qrImageUrl = null;
        if (StringUtils.hasText(bank.getBankCode()) && StringUtils.hasText(bank.getAccountNo())) {
            qrImageUrl = "https://img.vietqr.io/image/"
                    + bank.getBankCode().trim() + "-" + bank.getAccountNo().trim() + "-compact2.png"
                    + "?amount=" + order.getTotalAmount().longValue()
                    + "&addInfo=" + URLEncoder.encode(addInfo, StandardCharsets.UTF_8)
                    + "&accountName=" + URLEncoder.encode(
                    bank.getAccountName() != null ? bank.getAccountName() : "ARGATY",
                    StandardCharsets.UTF_8
            );
        }

        String qrContent = "BANK_TRANSFER|"
                + (bank.getBankCode() != null ? bank.getBankCode() : "") + "|"
                + (bank.getAccountNo() != null ? bank.getAccountNo() : "") + "|"
                + order.getTotalAmount().longValue() + "|" + addInfo;

        return PaymentSessionResponse.builder()
                .orderCode(order.getOrderCode())
                .paymentMethod(getMethod())
                .providerCode("BANK_QR")
                .transactionRef(txRef)
                .qrImageUrl(qrImageUrl)
                .qrContent(qrContent)
                .expiresAt(LocalDateTime.now().plusMinutes(appProperties.getPayment().getSessionExpireMinutes()))
                .message("Quét mã QR và xác nhận sau khi chuyển khoản")
                .build();
    }

    @Override
    public PaymentCallbackResult verifyCallback(Map<String, String> payload, String rawPayload) {
        return PaymentCallbackResult.builder()
                .success(false)
                .paid(false)
                .signatureValid(false)
                .message("Bank transfer sử dụng xác nhận thủ công hoặc webhook riêng")
                .build();
    }
}
