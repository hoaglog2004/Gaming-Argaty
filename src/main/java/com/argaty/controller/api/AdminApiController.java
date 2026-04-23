package com.argaty.controller.api;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.User;
import com.argaty.repository.OrderRepository;
import com.argaty.repository.ProductRepository;
import com.argaty.repository.ReviewRepository;
import com.argaty.repository.UserRepository;
import com.argaty.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
@RequiredArgsConstructor
public class AdminApiController {

	private final UserService userService;
	private final ProductRepository productRepository;
	private final UserRepository userRepository;
	private final OrderRepository orderRepository;
	private final ReviewRepository reviewRepository;

	@GetMapping("/summary")
	public ResponseEntity<ApiResponse<Map<String, Object>>> summary(Principal principal) {
		User user = requireAdmin(principal);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(ApiResponse.error("Ban khong co quyen truy cap"));
		}

		Map<String, Object> data = new HashMap<>();
		data.put("totalUsers", userRepository.count());
		data.put("totalProducts", productRepository.count());
		data.put("totalOrders", orderRepository.count());
		data.put("totalReviews", reviewRepository.count());
		data.put("lowStockProducts", productRepository.countLowStockProducts());

		BigDecimal revenue = orderRepository.getTotalRevenue();
		data.put("totalRevenue", revenue != null ? revenue : BigDecimal.ZERO);

		return ResponseEntity.ok(ApiResponse.success(data));
	}

	private User requireAdmin(Principal principal) {
		if (principal == null) {
			return null;
		}
		User user = userService.findByEmail(principal.getName()).orElse(null);
		if (user == null) {
			return null;
		}
		if (Boolean.TRUE.equals(user.isAdmin()) || Boolean.TRUE.equals(user.isStaff())) {
			return user;
		}
		return null;
	}
}

