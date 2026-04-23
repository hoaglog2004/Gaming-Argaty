package com.argaty.controller.api;

import java.security.Principal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.CancelOrderRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.OrderDetailResponse;
import com.argaty.dto.response.OrderResponse;
import com.argaty.dto.response.PageResponse;
import com.argaty.entity.Order;
import com.argaty.entity.User;
import com.argaty.enums.OrderStatus;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.exception.UnauthorizedException;
import com.argaty.service.OrderService;
import com.argaty.service.UserService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/orders", "/api/v1/orders"})
@RequiredArgsConstructor
public class OrderApiController {

	private final OrderService orderService;
	private final UserService userService;

	@GetMapping("/my")
	public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) String status,
			Principal principal) {

		User user = getCurrentUser(principal);
		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

		Page<Order> orders;
		if (status != null && !status.isBlank()) {
			try {
				OrderStatus orderStatus = OrderStatus.valueOf(status.trim().toUpperCase());
				List<Order> filteredAll = orderService.findByUserIdAndStatus(user.getId(), orderStatus);
				int start = (int) pageable.getOffset();
				int end = Math.min(start + pageable.getPageSize(), filteredAll.size());
				List<Order> content = start >= filteredAll.size()
						? List.of()
						: filteredAll.subList(start, end);
				orders = new PageImpl<>(content, pageable, filteredAll.size());
			} catch (IllegalArgumentException ex) {
				return ResponseEntity.badRequest().body(ApiResponse.error("Trang thai don hang khong hop le"));
			}
		} else {
			orders = orderService.findByUserId(user.getId(), pageable);
		}

		return ResponseEntity.ok(ApiResponse.success(DtoMapper.toOrderPageResponse(orders)));
	}

	@GetMapping("/my/{orderCode}")
	public ResponseEntity<ApiResponse<OrderDetailResponse>> getMyOrderDetail(
			@PathVariable String orderCode,
			Principal principal) {

		User user = getCurrentUser(principal);
		Order order = orderService.findByOrderCodeAndUserId(orderCode, user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));

		return ResponseEntity.ok(ApiResponse.success(DtoMapper.toOrderDetailResponse(order)));
	}

	@PatchMapping("/my/{orderCode}/cancel")
	public ResponseEntity<ApiResponse<OrderDetailResponse>> cancelMyOrder(
			@PathVariable String orderCode,
			@Valid @RequestBody CancelOrderRequest request,
			Principal principal) {

		User user = getCurrentUser(principal);
		Order order = orderService.findByOrderCodeAndUserId(orderCode, user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));

		try {
			Order cancelled = orderService.cancelOrder(order.getId(), user, request.getReason());
			return ResponseEntity.ok(ApiResponse.success("Da huy don hang", DtoMapper.toOrderDetailResponse(cancelled)));
		} catch (BadRequestException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	@GetMapping("/admin")
	public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAdminOrders(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String keyword,
			Principal principal) {

		requireAdmin(principal);

		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

		Page<Order> orders;
		if (keyword != null && !keyword.isBlank()) {
			orders = orderService.searchOrders(keyword.trim(), pageable);
		} else if (status != null && !status.isBlank()) {
			try {
				orders = orderService.findByStatus(OrderStatus.valueOf(status.trim().toUpperCase()), pageable);
			} catch (IllegalArgumentException ex) {
				return ResponseEntity.badRequest().body(ApiResponse.error("Trang thai don hang khong hop le"));
			}
		} else {
			orders = orderService.findAll(pageable);
		}

		return ResponseEntity.ok(ApiResponse.success(DtoMapper.toOrderPageResponse(orders)));
	}

	@GetMapping("/admin/{orderCode}")
	public ResponseEntity<ApiResponse<OrderDetailResponse>> getAdminOrderDetail(
			@PathVariable String orderCode,
			Principal principal) {

		requireAdmin(principal);
		Order order = orderService.findByOrderCode(orderCode)
				.orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));
		return ResponseEntity.ok(ApiResponse.success(DtoMapper.toOrderDetailResponse(order)));
	}

	private User getCurrentUser(Principal principal) {
		if (principal == null) {
			throw new UnauthorizedException("Vui long dang nhap");
		}
		return userService.findByEmail(principal.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User", "email", principal.getName()));
	}

	private User requireAdmin(Principal principal) {
		User user = getCurrentUser(principal);
		if (!Boolean.TRUE.equals(user.isAdmin()) && !Boolean.TRUE.equals(user.isStaff())) {
			throw new UnauthorizedException("Ban khong co quyen truy cap");
		}
		return user;
	}
}

