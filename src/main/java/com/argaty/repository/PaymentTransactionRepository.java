package com.argaty.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.argaty.entity.PaymentTransaction;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionRef(String transactionRef);

    Optional<PaymentTransaction> findByGatewayCodeAndProviderTransactionId(String gatewayCode, String providerTransactionId);

    boolean existsByGatewayCodeAndProviderTransactionId(String gatewayCode, String providerTransactionId);

    List<PaymentTransaction> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
