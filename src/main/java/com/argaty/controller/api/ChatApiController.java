package com.argaty.controller.api;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.ApiResponse;
import com.argaty.dto.ChatMessageDTO;
import com.argaty.dto.ChatSessionDTO;
import com.argaty.entity.User;
import com.argaty.repository.UserRepository;
import com.argaty.service.ChatService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/chat", "/api/v1/chat"})
@RequiredArgsConstructor
public class ChatApiController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    /**
     * Bắt đầu một phiên chat mới
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<ChatSessionDTO>> startChat(@Valid @RequestBody StartChatRequest request) {
        try {
            ChatSessionDTO session = chatService.startChat(
                request.getVisitorName(),
                request.getVisitorEmail(),
                request.getVisitorPhone()
            );
            
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Chat session started", session)
            );
        } catch (Exception e) {
            log.error("Error starting chat: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    @PostMapping("/start-auth")
    public ResponseEntity<ApiResponse<ChatSessionDTO>> startChatAuthenticated(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401)
                    .body(new ApiResponse<>("error", "Vui lòng đăng nhập để bắt đầu chat", null));
        }

        try {
            User user = userRepository.findByEmail(principal.getName()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(401)
                        .body(new ApiResponse<>("error", "Phiên đăng nhập không hợp lệ", null));
            }

            ChatSessionDTO session = chatService.startChatForUser(
                    user.getEmail(),
                    user.getFullName(),
                    user.getPhone()
            );

            return ResponseEntity.ok(
                    new ApiResponse<>("success", "Chat session started", session)
            );
        } catch (Exception e) {
            log.error("Error starting authenticated chat: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Gửi tin nhắn
     */
    @PostMapping("/{sessionId}/send")
    public ResponseEntity<ApiResponse<ChatMessageDTO>> sendMessage(
            @PathVariable String sessionId,
            @Valid @RequestBody SendMessageRequest request) {
        try {
            ChatMessageDTO message = chatService.sendMessage(
                sessionId,
                request.getMessage(),
                request.getSender()
            );
            
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Message sent", message)
            );
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy lịch sử chat
     */
    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getConversation(
            @PathVariable String sessionId) {
        try {
            List<ChatMessageDTO> messages = chatService.getConversation(sessionId);
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Conversation retrieved", messages)
            );
        } catch (Exception e) {
            log.error("Error getting conversation: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy thông tin phiên chat
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<ChatSessionDTO>> getChatSession(
            @PathVariable String sessionId) {
        try {
            ChatSessionDTO session = chatService.getChatSession(sessionId);
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Chat session retrieved", session)
            );
        } catch (Exception e) {
            log.error("Error getting chat session: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy số lượng người chờ
     */
    @GetMapping("/queue/count")
    public ResponseEntity<ApiResponse<QueueCountResponse>> getQueueCount() {
        try {
            long count = chatService.getWaitingQueueCount();
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Queue count retrieved",
                    QueueCountResponse.builder()
                        .waitingCount(count)
                        .build())
            );
        } catch (Exception e) {
            log.error("Error getting queue count: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy danh sách hàng đợi
     */
    @GetMapping("/queue/list")
    public ResponseEntity<ApiResponse<List<ChatSessionDTO>>> getWaitingQueue() {
        try {
            List<ChatSessionDTO> queue = chatService.getWaitingQueue();
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Waiting queue retrieved", queue)
            );
        } catch (Exception e) {
            log.error("Error getting waiting queue: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Đóng chat
     */
    @PostMapping("/{sessionId}/close")
    public ResponseEntity<ApiResponse<Void>> closeChat(
            @PathVariable String sessionId,
            @RequestParam(required = false) String reason) {
        try {
            chatService.closeChat(sessionId, reason != null ? reason : "User closed");
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Chat closed", null)
            );
        } catch (Exception e) {
            log.error("Error closing chat: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Mark tin nhắn là đã đọc
     */
    @PostMapping("/message/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markMessageAsRead(
            @PathVariable Long messageId) {
        try {
            chatService.markMessageAsRead(messageId);
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Message marked as read", null)
            );
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    // DTO Classes
    @lombok.Data
    public static class StartChatRequest {
        @NotBlank(message = "Visitor name is required")
        private String visitorName;
        
        private String visitorEmail;
        private String visitorPhone;
    }

    @lombok.Data
    public static class SendMessageRequest {
        @NotBlank(message = "Message cannot be empty")
        private String message;
        
        @NotBlank(message = "Sender is required")
        private String sender; // "visitor" or "admin"
    }

    @lombok.Data
    @lombok.Builder
    public static class QueueCountResponse {
        private long waitingCount;
    }
}
