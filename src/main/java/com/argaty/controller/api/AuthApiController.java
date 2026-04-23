package com.argaty.controller.api;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.ForgotPasswordApiRequest;
import com.argaty.dto.request.LoginRequest;
import com.argaty.dto.request.RefreshTokenRequest;
import com.argaty.dto.request.RegisterRequest;
import com.argaty.dto.request.ResetPasswordApiRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.User;
import com.argaty.exception.BadRequestException;
import com.argaty.service.JwtTokenService;
import com.argaty.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
@RequiredArgsConstructor
@Validated
public class AuthApiController {

	private final UserService userService;
	private final JwtTokenService jwtTokenService;

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
		User user = userService.findByEmail(request.getEmail()).orElse(null);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Email hoac mat khau khong dung"));
		}

		if (!user.canLogin()) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Tai khoan da bi khoa hoac tam ngung"));
		}

		if (!userService.checkPassword(user, request.getPassword())) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Email hoac mat khau khong dung"));
		}

		userService.updateLastLogin(user.getId());

		String accessToken = jwtTokenService.generateAccessToken(user);
		String refreshToken = jwtTokenService.generateRefreshToken(user);

		Map<String, Object> data = new HashMap<>();
		data.put("accessToken", accessToken);
		data.put("refreshToken", refreshToken);
		data.put("tokenType", "Bearer");
		data.put("id", user.getId());
		data.put("fullName", user.getFullName());
		data.put("email", user.getEmail());
		data.put("role", user.getRole() != null ? user.getRole().name() : null);

		return ResponseEntity.ok(ApiResponse.success("Dang nhap thanh cong", data));
	}

	@PostMapping("/refresh")
	public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
		String refreshToken = request.getRefreshToken();

		try {
			if (!jwtTokenService.isRefreshToken(refreshToken) || jwtTokenService.isExpired(refreshToken)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Refresh token khong hop le"));
			}

			String email = jwtTokenService.extractEmail(refreshToken);
			User user = userService.findByEmail(email).orElse(null);
			if (user == null || !user.canLogin()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Nguoi dung khong hop le"));
			}

			String newAccessToken = jwtTokenService.generateAccessToken(user);
			Map<String, Object> data = new HashMap<>();
			data.put("accessToken", newAccessToken);
			data.put("refreshToken", refreshToken);
			data.put("tokenType", "Bearer");

			return ResponseEntity.ok(ApiResponse.success("Lam moi token thanh cong", data));
		} catch (Exception ex) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Refresh token khong hop le"));
		}
	}

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
		if (!request.getPassword().equals(request.getConfirmPassword())) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Mat khau xac nhan khong khop"));
		}

		if (request.getAgreeTerms() == null || !request.getAgreeTerms()) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Vui long dong y voi dieu khoan su dung"));
		}

		try {
			User user = userService.register(
					request.getFullName(),
					request.getEmail(),
					request.getPassword(),
					request.getPhone());

			Map<String, Object> data = new HashMap<>();
			data.put("id", user.getId());
			data.put("email", user.getEmail());
			data.put("fullName", user.getFullName());

			return ResponseEntity.ok(ApiResponse.success("Dang ky thanh cong", data));
		} catch (BadRequestException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordApiRequest request) {
		try {
			userService.createPasswordResetToken(request.getEmail());
		} catch (Exception ignored) {
			// Do not reveal whether email exists.
		}
		return ResponseEntity.ok(ApiResponse.success("Neu email ton tai, ban se nhan duoc huong dan dat lai mat khau"));
	}

	@GetMapping("/reset-password/validate")
	public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@RequestParam String token) {
		boolean valid = userService.validatePasswordResetToken(token);
		return ResponseEntity.ok(ApiResponse.success(valid));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordApiRequest request) {
		if (!request.getNewPassword().equals(request.getConfirmPassword())) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Mat khau xac nhan khong khop"));
		}

		try {
			userService.resetPassword(request.getToken(), request.getNewPassword());
			return ResponseEntity.ok(ApiResponse.success("Dat lai mat khau thanh cong"));
		} catch (BadRequestException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<Map<String, Object>>> me(Principal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.error("Chua dang nhap"));
		}

		User user = userService.findByEmail(principal.getName())
				.orElse(null);

		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.error("Phien dang nhap khong hop le"));
		}

		Map<String, Object> data = new HashMap<>();
		data.put("id", user.getId());
		data.put("fullName", user.getFullName());
		data.put("email", user.getEmail());
		data.put("phone", user.getPhone());
		data.put("avatar", user.getAvatar());
		data.put("role", user.getRole() != null ? user.getRole().name() : null);
		data.put("isAdmin", user.isAdmin());
		data.put("isStaff", user.isStaff());
		data.put("authenticated", true);

		return ResponseEntity.ok(ApiResponse.success(data));
	}
}

