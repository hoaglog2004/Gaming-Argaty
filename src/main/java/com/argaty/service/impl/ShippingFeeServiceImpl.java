package com.argaty.service.impl;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.argaty.dto.request.ShippingQuoteRequest;
import com.argaty.service.ShippingFeeService;
import com.argaty.service.ShippingQuoteService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShippingFeeServiceImpl implements ShippingFeeService {

    private final ShippingQuoteService shippingQuoteService;

    @Override
    public BigDecimal calculateFee(BigDecimal subtotal,
                                   String city,
                                   String district,
                                   String ward,
                                   String address,
                                   int itemCount) {
        return shippingQuoteService.quote(
                ShippingQuoteRequest.builder()
                        .subtotal(subtotal)
                        .itemCount(itemCount)
                        .city(city)
                        .district(district)
                        .ward(ward)
                        .address(address)
                        .build()
        ).getShippingFee();
    }
}
