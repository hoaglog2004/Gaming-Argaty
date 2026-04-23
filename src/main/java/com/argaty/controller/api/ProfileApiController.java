package com.argaty.controller.api;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.ChangePasswordRequest;
import com.argaty.dto.request.UpdateProfileRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.User;
import com.argaty.exception.BadRequestException;
import com.argaty.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/profile", "/api/v1/profile"})
@RequiredArgsConstructor
public class ProfileApiController {

	private final UserService userService;

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<Map<String, Object>>> me(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.error("Vui long dang nhap"));
		}

		User user = userService.findByEmail(principal.getName())
				.orElse(null);

		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.error("Khong tim thay tai khoan"));
		}

		Map<String, Object> data = new HashMap<>();
		data.put("id", user.getId());
		data.put("fullName", user.getFullName());
		data.put("email", user.getEmail());
		data.put("phone", user.getPhone());
		data.put("avatar", user.getAvatar());
		data.put("address", user.getAddress());
		data.put("city", user.getCity());
		data.put("district", user.getDistrict());
		data.put("ward", user.getWard());
		data.put("role", user.getRole() != null ? user.getRole().name() : null);

		return ResponseEntity.ok(ApiResponse.success(data));
	}

	@PutMapping("/me")
	public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
			@Valid @RequestBody UpdateProfileRequest request,
			Principal principal) {

		User user = getCurrentUser(principal);

		try {
			User updated = userService.updateProfile(user.getId(), request.getFullName(), request.getPhone(), request.getAvatar());
			if (request.getAddress() != null || request.getCity() != null || request.getDistrict() != null || request.getWard() != null) {
				updated = userService.updateAddress(
						user.getId(),
						request.getAddress(),
						request.getCity(),
						request.getDistrict(),
						request.getWard());
			}

			Map<String, Object> data = new HashMap<>();
			data.put("id", updated.getId());
			data.put("fullName", updated.getFullName());
			data.put("email", updated.getEmail());
			data.put("phone", updated.getPhone());
			data.put("avatar", updated.getAvatar());
			data.put("address", updated.getAddress());
			data.put("city", updated.getCity());
			data.put("district", updated.getDistrict());
			data.put("ward", updated.getWard());

			return ResponseEntity.ok(ApiResponse.success("Cap nhat thong tin thanh cong", data));
		} catch (BadRequestException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	@PostMapping("/change-password")
	public ResponseEntity<ApiResponse<Void>> changePassword(
			@Valid @RequestBody ChangePasswordRequest request,
			Principal principal) {

		User user = getCurrentUser(principal);

		if (!request.getNewPassword().equals(request.getConfirmPassword())) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Mat khau xac nhan khong khop"));
		}

		if (!userService.checkPassword(user, request.getCurrentPassword())) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Mat khau hien tai khong dung"));
		}

		userService.updatePassword(user.getId(), request.getNewPassword());
		return ResponseEntity.ok(ApiResponse.success("Doi mat khau thanh cong"));
	}

	private User getCurrentUser(Principal principal) {
		if (principal == null) {
			throw new com.argaty.exception.UnauthorizedException("Vui long dang nhap");
		}
		return userService.findByEmail(principal.getName())
				.orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "email", principal.getName()));
	}
}

