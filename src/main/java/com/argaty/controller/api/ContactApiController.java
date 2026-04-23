package com.argaty.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.ApiResponse;
import com.argaty.service.EmailService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/contact", "/api/v1/contact"})
@RequiredArgsConstructor
public class ContactApiController {

    private final EmailService emailService;

    @PostMapping("/send-message")
    public ResponseEntity<ApiResponse<Void>> sendContactMessage(@Valid @RequestBody ContactMessageRequest request) {
        try {
            log.info("Received contact message from: {} ({})", request.getName(), request.getEmail());
            
            // Gửi email tới khách hàng
            emailService.sendHtmlEmail(
                request.getEmail(),
                "ARGATY - Xác nhận nhận tin nhắn của bạn",
                buildConfirmationEmail(request.getName())
            );
            
            // Gửi email tới admin/support
            emailService.sendContactMessageEmail(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getSubject(),
                request.getMessage()
            );
            
            return ResponseEntity.ok(new ApiResponse<>("success", "Tin nhắn của bạn đã được gửi thành công!", null));
        } catch (Exception e) {
            log.error("Error sending contact message: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", "Không thể gửi tin nhắn. Vui lòng thử lại sau.", null));
        }
    }

    private String buildConfirmationEmail(String name) {
        return String.format("""
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
                    .content { padding: 20px; border: 1px solid #ddd; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ARGATY</h1>
                        <p>Xác nhận nhận tin nhắn của bạn</p>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>%s</strong>,</p>
                        <p>Cảm ơn bạn đã gửi tin nhắn tới ARGATY. Chúng tôi đã nhận được thông tin của bạn và sẽ phản hồi trong thời gian sớm nhất (thường trong 24 giờ).</p>
                        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:</p>
                        <ul>
                            <li><strong>Email:</strong> support@argaty.vn</li>
                            <li><strong>Hotline:</strong> 1900 1508</li>
                        </ul>
                        <p>Trân trọng,<br><strong>ARGATY Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 ARGATY. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, name);
    }

    @lombok.Data
    public static class ContactMessageRequest {
        @NotBlank(message = "Tên không được để trống")
        private String name;

        @Email(message = "Email không hợp lệ")
        @NotBlank(message = "Email không được để trống")
        private String email;

        private String phone;

        @NotBlank(message = "Chủ đề không được để trống")
        private String subject;

        @NotBlank(message = "Nội dung không được để trống")
        private String message;
    }
}
