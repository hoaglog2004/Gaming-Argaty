package com.argaty.controller.api;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.PaymentCallbackResult;
import com.argaty.dto.response.PaymentSessionResponse;
import com.argaty.entity.Order;
import com.argaty.entity.User;
import com.argaty.enums.PaymentMethod;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.service.PaymentProcessingService;
import com.argaty.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/payments", "/api/v1/payments"})
@RequiredArgsConstructor
public class PaymentApiController {

    private final PaymentProcessingService paymentProcessingService;
    private final UserService userService;

    @PostMapping("/{orderCode}/session")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> createSession(@PathVariable String orderCode,
                                                                             Principal principal) {
        User user = requireUser(principal);
        String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        PaymentSessionResponse session = paymentProcessingService.createPaymentSession(orderCode, user.getId(), baseUrl);
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping("/{orderCode}/bank-confirm")
    public ResponseEntity<ApiResponse<String>> bankConfirm(@PathVariable String orderCode, Principal principal) {
        User user = requireUser(principal);
        Order order = paymentProcessingService.confirmBankTransfer(orderCode, user.getId());
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ xĂ¡c nháº­n thanh toĂ¡n", order.getOrderCode()));
    }

    @GetMapping("/{orderCode}/status")
    public ResponseEntity<ApiResponse<Boolean>> paymentStatus(@PathVariable String orderCode, Principal principal) {
        User user = requireUser(principal);
        boolean paid = paymentProcessingService.isOrderPaid(orderCode, user.getId());
        return ResponseEntity.ok(ApiResponse.success(paid));
    }

    @RequestMapping(value = "/callback/momo", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<String> momoCallback(@RequestParam Map<String, String> payload) {
        PaymentCallbackResult result = paymentProcessingService.processCallback(PaymentMethod.MOMO, payload, payload.toString());
        return ResponseEntity.ok(result.isSuccess() ? "OK" : "FAILED");
    }

    @RequestMapping(value = "/callback/zalopay", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<String> zaloPayCallback(@RequestParam Map<String, String> payload) {
        PaymentCallbackResult result = paymentProcessingService.processCallback(PaymentMethod.ZALOPAY, payload, payload.toString());
        return ResponseEntity.ok(result.isSuccess() ? "OK" : "FAILED");
    }

    @GetMapping("/mock/complete")
    public ResponseEntity<ApiResponse<PaymentCallbackResult>> mockComplete(@RequestParam String gateway,
                                                                            @RequestParam Map<String, String> payload) {
        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(gateway.trim().toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Gateway mock khĂ´ng há»£p lá»‡");
        }

        Map<String, String> callbackPayload = new HashMap<>(payload);
        PaymentCallbackResult result = paymentProcessingService.processCallback(method, callbackPayload, callbackPayload.toString());

        if (result.isSuccess()) {
            return ResponseEntity.ok(ApiResponse.success("Thanh toĂ¡n mock thĂ nh cĂ´ng", result));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage(), result));
    }

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new BadRequestException("Vui lĂ²ng Ä‘Äƒng nháº­p");
        }
        return userService.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", principal.getName()));
    }
}

