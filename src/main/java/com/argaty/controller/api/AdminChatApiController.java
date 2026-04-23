package com.argaty.controller.api;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
@RequestMapping({"/api/admin/chat", "/api/v1/admin/chat"})
@RequiredArgsConstructor
public class AdminChatApiController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách chat đang chờ
     */
    @GetMapping("/queue")
    @PreAuthorize("isAuthenticated()")
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

    @GetMapping("/sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatSessionDTO>>> getOpenSessions() {
        try {
            List<ChatSessionDTO> sessions = chatService.getOpenChats();
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Open sessions retrieved", sessions)
            );
        } catch (Exception e) {
            log.error("Error getting open sessions: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy chi tiết một phiên chat
     */
    @GetMapping("/{sessionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChatSessionDTO>> getSessionDetail(
            @PathVariable String sessionId) {
        try {
            ChatSessionDTO session = chatService.getChatSession(sessionId);
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Chat session retrieved", session)
            );
        } catch (Exception e) {
            log.error("Error getting chat session {}: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy danh sách tin nhắn của một phiên chat
     */
    @GetMapping("/{sessionId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getSessionMessages(
            @PathVariable String sessionId) {
        try {
            List<ChatMessageDTO> messages = chatService.getMessages(sessionId);
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Conversation retrieved", messages)
            );
        } catch (Exception e) {
            log.error("Error getting chat messages {}: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Assign chat cho admin
     */
    @PostMapping("/{sessionId}/assign")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChatSessionDTO>> assignChat(
            @PathVariable String sessionId,
            @Valid @RequestBody AssignChatRequest request) {
        try {
            ChatSessionDTO session = chatService.assignChatToAdmin(
                sessionId,
                request.getAdminId(),
                request.getAdminName()
            );
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Chat assigned to admin", session)
            );
        } catch (Exception e) {
            log.error("Error assigning chat: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Lấy danh sách chat active của admin
     */
    @GetMapping("/my-chats/{adminId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatSessionDTO>>> getMyChats(
            @PathVariable Long adminId) {
        try {
            List<ChatSessionDTO> chats = chatService.getAdminActiveChats(adminId);
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Admin active chats retrieved", chats)
            );
        } catch (Exception e) {
            log.error("Error getting admin chats: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    /**
     * Admin gửi tin nhắn tới user
     */
    @PostMapping("/{sessionId}/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> sendAdminMessage(
            @PathVariable String sessionId,
            @Valid @RequestBody AdminSendMessageRequest request,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401)
                        .body(new ApiResponse<>("error", "Vui lòng đăng nhập", null));
            }

            User admin = userRepository.findByEmail(principal.getName()).orElse(null);
            if (admin == null) {
                return ResponseEntity.status(401)
                        .body(new ApiResponse<>("error", "Phiên đăng nhập không hợp lệ", null));
            }

            ChatSessionDTO session = chatService.getChatSession(sessionId);
            if (!"connected".equalsIgnoreCase(session.getStatus()) || session.getAssignedAdminName() == null) {
                chatService.assignChatToAdmin(
                        sessionId,
                        admin.getId(),
                        admin.getFullName() != null ? admin.getFullName() : admin.getEmail()
                );
            }

            chatService.sendMessage(sessionId, request.getMessage(), "admin");
            return ResponseEntity.ok(
                new ApiResponse<>("success", "Message sent", null)
            );
        } catch (Exception e) {
            log.error("Error sending admin message: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }

    // DTO Classes
    @lombok.Data
    public static class AssignChatRequest {
        @NotBlank(message = "Admin ID is required")
        private String adminId;

        @NotBlank(message = "Admin name is required")
        private String adminName;

        public Long getAdminId() {
            return Long.parseLong(adminId);
        }
    }

    @lombok.Data
    public static class AdminSendMessageRequest {
        @NotBlank(message = "Message cannot be empty")
        private String message;
    }
}
