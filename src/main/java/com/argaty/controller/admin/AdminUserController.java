package com.argaty.controller.admin;

import com.argaty.dto.response.UserResponse;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.PageResponse;
import com.argaty.entity.User;
import com.argaty.enums.Role;
import com.argaty.service.OrderService;
import com.argaty.service.UserService;
import com.argaty.util.DtoMapper;
import org.springframework.dao.DataIntegrityViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý người dùng (Admin)
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users;
        if (q != null && !q.trim().isEmpty()) {
            users = userService.searchUsers(q.trim(), pageRequest);
        } else if (role != null && !role.isEmpty()) {
            try {
                Role userRole = Role.valueOf(role.toUpperCase());
                users = userService.findByRole(userRole, pageRequest);
            } catch (IllegalArgumentException e) {
                users = userService.findAll(pageRequest);
            }
        } else {
            users = userService.findAll(pageRequest);
        }

        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toUserPageResponse(users)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> detail(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "id", id));

        UserResponse userResponse = UserResponse.fromEntity(user);
        userResponse.setOrderCount(orderService.countByUserId(id));
        userResponse.setTotalSpent(orderService.getTotalSpentByUser(id).longValue());

        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    public static class RoleUpdateRequest {
        public String role;
    }

    public static class BanRequest {
        public String reason;
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<Void>> updateRole(
            @PathVariable Long id,
            @RequestBody RoleUpdateRequest request) {

        try {
            Role newRole = Role.valueOf(request.role.toUpperCase());
            userService.updateRole(id, newRole);
            return ResponseEntity.ok(ApiResponse.success("Đã cập nhật vai trò"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<Void>> banUser(
            @PathVariable Long id,
            @RequestBody BanRequest request) {

        userService.banUser(id, request.reason);
        return ResponseEntity.ok(ApiResponse.success("Đã khóa tài khoản"));
    }

    @PatchMapping("/{id}/unban")
    public ResponseEntity<ApiResponse<Void>> unbanUser(@PathVariable Long id) {
        userService.unbanUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa tài khoản"));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "id", id));
        if (user.getIsEnabled()) {
            userService.disableUser(id);
            return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa tài khoản"));
        } else {
            userService.enableUser(id);
            return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt tài khoản"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Đã xóa tài khoản người dùng"));
        } catch (DataIntegrityViolationException e) {
            userService.disableUser(id);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Tài khoản đang có dữ liệu liên quan, đã chuyển sang vô hiệu hóa."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Không thể xóa tài khoản: " + e.getMessage()));
        }
    }
}