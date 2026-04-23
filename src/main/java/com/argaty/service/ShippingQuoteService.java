package com.argaty.service;

import com.argaty.dto.request.ShippingQuoteRequest;
import com.argaty.dto.response.ShippingQuoteResponse;

public interface ShippingQuoteService {

    ShippingQuoteResponse quote(ShippingQuoteRequest request);
}
