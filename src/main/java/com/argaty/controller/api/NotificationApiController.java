package com.argaty.controller.api;

import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.NotificationResponse;
import com.argaty.entity.Notification;
import com.argaty.entity.User;
import com.argaty.service.NotificationService;
import com.argaty.service.UserService;
import com.argaty.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller cho thĂ´ng bĂ¡o
 */
@RestController
@RequestMapping({"/api/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
public class NotificationApiController {

    private final NotificationService notificationService;
    private final UserService userService;

    /**
     * Láº¥y danh sĂ¡ch thĂ´ng bĂ¡o gáº§n Ä‘Ă¢y
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(Principal principal) {
        User user = getCurrentUser(principal);
        List<Notification> notifications = notificationService.findRecentByUserId(user.getId(), 10);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toNotificationResponseList(notifications)));
    }

    /**
     * Láº¥y thĂ´ng bĂ¡o chÆ°a Ä‘á»c
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications(Principal principal) {
        User user = getCurrentUser(principal);
        List<Notification> notifications = notificationService.findUnreadByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toNotificationResponseList(notifications)));
    }

    /**
     * Äáº¿m sá»‘ thĂ´ng bĂ¡o chÆ°a Ä‘á»c
     */
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Integer>> getUnreadCount(Principal principal) {
        User user = getCurrentUser(principal);
        int count = notificationService.countUnreadByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Láº¥y thĂ´ng bĂ¡o + sá»‘ chÆ°a Ä‘á»c (cho header)
     */
    @GetMapping("/header")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHeaderNotifications(Principal principal) {
        User user = getCurrentUser(principal);

        List<Notification> notifications = notificationService.findRecentByUserId(user.getId(), 5);
        int unreadCount = notificationService.countUnreadByUserId(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("notifications", DtoMapper.toNotificationResponseList(notifications));
        data.put("unreadCount", unreadCount);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * ÄĂ¡nh dáº¥u Ä‘Ă£ Ä‘á»c má»™t thĂ´ng bĂ¡o
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id, Principal principal) {
        getCurrentUser(principal); // Verify user
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ Ä‘Ă¡nh dáº¥u Ä‘Ă£ Ä‘á»c"));
    }

    /**
     * ÄĂ¡nh dáº¥u táº¥t cáº£ Ä‘Ă£ Ä‘á»c
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Principal principal) {
        User user = getCurrentUser(principal);
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ Ä‘Ă¡nh dáº¥u táº¥t cáº£ Ä‘Ă£ Ä‘á»c"));
    }

    private User getCurrentUser(Principal principal) {
        if (principal == null) {
            throw new com.argaty.exception.UnauthorizedException("Vui lĂ²ng Ä‘Äƒng nháº­p");
        }
        return userService.findByEmail(principal.getName())
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "email", principal.getName()));
    }
}
