package com.argaty.controller.admin;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.UpdateOrderStatusRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.Order;
import com.argaty.entity.User;
import com.argaty.enums.OrderStatus;
import com.argaty.service.OrderService;
import com.argaty.service.UserService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {

        requireAdmin(principal);

        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders;
        if (q != null && !q.trim().isEmpty()) {
            orders = orderService.searchOrders(q.trim(), pageRequest);
        } else if (status != null && !status.isEmpty()) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.findByStatus(orderStatus, pageRequest);
            } catch (IllegalArgumentException e) {
                orders = orderService.findAll(pageRequest);
            }
        } else {
            orders = orderService.findAll(pageRequest);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("orders", DtoMapper.toOrderPageResponse(orders));
        data.put("orderStatuses", OrderStatus.values());
        data.put("searchKeyword", q);
        data.put("selectedStatus", status);
        data.put("page", pageIndex);
        data.put("size", pageSize);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> detail(@PathVariable Long id, Principal principal) {
        requireAdmin(principal);

        Order order = orderService.findByIdWithDetails(id)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("Order", "id", id));

        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toOrderDetailResponse(order)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            Principal principal) {

        User admin = requireAdmin(principal);
        try {
            orderService.updateStatus(id, request.getStatus(), admin, request.getNote());
            return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/mark-paid")
    public ResponseEntity<ApiResponse<Void>> markPaid(@PathVariable Long id, Principal principal) {
        requireAdmin(principal);

        try {
            orderService.updatePaymentStatus(id, true, null);
            return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đơn hàng đã thanh toán"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/quick-view/{id}")
    public ResponseEntity<ApiResponse<?>> quickView(@PathVariable Long id, Principal principal) {
        requireAdmin(principal);

        Order order = orderService.findByIdWithDetails(id)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("Order", "id", id));

        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toOrderDetailResponse(order)));
    }

    private User requireAdmin(Principal principal) {
        if (principal == null) {
            throw new com.argaty.exception.UnauthorizedException("Vui lòng đăng nhập");
        }
        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "email", principal.getName()));
        if (!Boolean.TRUE.equals(user.isAdmin()) && !Boolean.TRUE.equals(user.isStaff())) {
            throw new com.argaty.exception.UnauthorizedException("Bạn không có quyền truy cập");
        }
        return user;
    }
}
