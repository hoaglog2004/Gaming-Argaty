package com.argaty.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.ShippingQuoteRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.ShippingQuoteResponse;
import com.argaty.service.ShippingQuoteService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/shipping", "/api/v1/shipping"})
@RequiredArgsConstructor
@Validated
public class ShippingApiController {

    private final ShippingQuoteService shippingQuoteService;

    @PostMapping("/quote")
    public ResponseEntity<ApiResponse<ShippingQuoteResponse>> quote(@Valid @RequestBody ShippingQuoteRequest request) {
        ShippingQuoteResponse quote = shippingQuoteService.quote(request);
        return ResponseEntity.ok(ApiResponse.success(quote));
    }
}

