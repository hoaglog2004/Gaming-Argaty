package com.argaty.service;

import com.argaty.dto.request.ShippingQuoteRequest;
import com.argaty.dto.response.ShippingQuoteResponse;

public interface ShippingProviderClient {

    String getProviderCode();

    String getProviderName();

    boolean isAvailable();

    ShippingQuoteResponse quote(ShippingQuoteRequest request);
}
