package com.argaty.entity;

import java.time.LocalDateTime;

import com.argaty.enums.PaymentMethod;
import com.argaty.enums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "gateway_code", nullable = false, length = 30)
    private String gatewayCode;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    @Column(name = "provider_transaction_id", length = 120)
    private String providerTransactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status;

    @Column(name = "signature_verified", nullable = false)
    @Builder.Default
    private Boolean signatureVerified = false;

    @Column(name = "request_payload", columnDefinition = "NVARCHAR(MAX)")
    private String requestPayload;

    @Column(name = "response_payload", columnDefinition = "NVARCHAR(MAX)")
    private String responsePayload;

    @Column(name = "callback_at")
    private LocalDateTime callbackAt;
}
