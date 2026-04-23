package com.argaty.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.NewsletterSubscriptionRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.service.EmailService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/newsletter", "/api/v1/newsletter"})
@RequiredArgsConstructor
public class NewsletterApiController {

    private final EmailService emailService;

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<Void>> subscribe(@Valid @RequestBody NewsletterSubscriptionRequest request) {
        emailService.sendNewsletterSubscriptionEmail(request.getEmail().trim());
        return ResponseEntity.ok(ApiResponse.success("Dang ky newsletter thanh cong"));
    }
}
