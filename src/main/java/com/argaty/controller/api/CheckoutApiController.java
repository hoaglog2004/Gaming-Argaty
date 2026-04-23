package com.argaty.controller.api;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.CheckoutRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.CheckoutPreviewResponse;
import com.argaty.dto.response.OrderDetailResponse;
import com.argaty.entity.Cart;
import com.argaty.entity.Order;
import com.argaty.entity.User;
import com.argaty.entity.UserAddress;
import com.argaty.entity.Voucher;
import com.argaty.enums.PaymentMethod;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.exception.UnauthorizedException;
import com.argaty.service.CartService;
import com.argaty.service.OrderService;
import com.argaty.service.ShippingFeeService;
import com.argaty.service.UserAddressService;
import com.argaty.service.UserService;
import com.argaty.service.VoucherService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/checkout", "/api/v1/checkout"})
@RequiredArgsConstructor
public class CheckoutApiController {

	private final CartService cartService;
	private final OrderService orderService;
	private final UserService userService;
	private final UserAddressService userAddressService;
	private final VoucherService voucherService;
	private final ShippingFeeService shippingFeeService;

	@GetMapping("/preview")
	public ResponseEntity<ApiResponse<CheckoutPreviewResponse>> preview(
			@RequestParam(required = false) Long addressId,
			@RequestParam(required = false) String city,
			@RequestParam(required = false) String district,
			@RequestParam(required = false) String ward,
			@RequestParam(required = false) String shippingAddress,
			@RequestParam(required = false) String voucherCode,
			Principal principal) {

		User user = getCurrentUser(principal);
		Cart cart = cartService.findByUserIdWithItems(user.getId());

		if (cart == null || cart.isEmpty() || cart.getSelectedItemCount() == 0) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Gio hang dang trong"));
		}

		String resolvedCity = city;
		String resolvedDistrict = district;
		String resolvedWard = ward;
		String resolvedAddress = shippingAddress;

		if (addressId != null) {
			UserAddress address = userAddressService.findByIdAndUserId(addressId, user.getId())
					.orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
			resolvedCity = address.getCity();
			resolvedDistrict = address.getDistrict();
			resolvedWard = address.getWard();
			resolvedAddress = address.getAddress();
		} else {
			UserAddress defaultAddress = userAddressService.findDefaultAddress(user.getId()).orElse(null);
			if (defaultAddress != null) {
				resolvedCity = resolvedCity != null ? resolvedCity : defaultAddress.getCity();
				resolvedDistrict = resolvedDistrict != null ? resolvedDistrict : defaultAddress.getDistrict();
				resolvedWard = resolvedWard != null ? resolvedWard : defaultAddress.getWard();
				resolvedAddress = resolvedAddress != null ? resolvedAddress : defaultAddress.getAddress();
			}
		}

		BigDecimal subtotal = cart.getTotalAmount();
		BigDecimal shippingFee = shippingFeeService.calculateFee(
				subtotal,
				resolvedCity,
				resolvedDistrict,
				resolvedWard,
				resolvedAddress,
				cart.getSelectedItemCount());

		BigDecimal discountAmount = BigDecimal.ZERO;
		Voucher appliedVoucher = null;
		String voucherError = null;

		if (voucherCode != null && !voucherCode.isBlank()) {
			try {
				discountAmount = voucherService.calculateDiscount(voucherCode.trim(), subtotal);
				appliedVoucher = voucherService.findByCode(voucherCode.trim()).orElse(null);
			} catch (Exception ex) {
				voucherError = ex.getMessage();
			}
		}

		BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discountAmount).max(BigDecimal.ZERO);
		List<Voucher> availableVouchers = voucherService.findVouchersForUser(user.getId(), subtotal);

		CheckoutPreviewResponse response = CheckoutPreviewResponse.builder()
				.items(DtoMapper.toCartResponse(cart).getItems())
				.totalItems(cart.getSelectedItemCount())
				.subtotal(subtotal)
				.shippingFee(shippingFee)
				.discountAmount(discountAmount)
				.totalAmount(totalAmount)
				.voucherCode(voucherCode)
				.voucherName(appliedVoucher != null ? appliedVoucher.getName() : null)
				.voucherDiscount(appliedVoucher != null ? appliedVoucher.getDiscountType().name() : null)
				.voucherApplied(appliedVoucher != null)
				.voucherError(voucherError)
				.availableVouchers(DtoMapper.toVoucherResponseList(availableVouchers))
				.build();

		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@PostMapping("/place-order")
	public ResponseEntity<ApiResponse<OrderDetailResponse>> placeOrder(
			@Valid @RequestBody CheckoutRequest request,
			Principal principal) {

		User user = getCurrentUser(principal);
		CheckoutRequest normalizedRequest = normalizeRequest(request, user);

		try {
			Order order = orderService.createOrder(
					user.getId(),
					normalizedRequest.getReceiverName(),
					normalizedRequest.getReceiverPhone(),
					normalizedRequest.getReceiverEmail(),
					normalizedRequest.getShippingAddress(),
					normalizedRequest.getCity(),
					normalizedRequest.getDistrict(),
					normalizedRequest.getWard(),
					normalizedRequest.getPaymentMethod() != null ? normalizedRequest.getPaymentMethod() : PaymentMethod.COD,
					normalizedRequest.getVoucherCode(),
					normalizedRequest.getNote());

			return ResponseEntity.ok(ApiResponse.success("Dat hang thanh cong", DtoMapper.toOrderDetailResponse(order)));
		} catch (BadRequestException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	private CheckoutRequest normalizeRequest(CheckoutRequest request, User user) {
		if (request.getAddressId() != null) {
			UserAddress savedAddress = userAddressService.findByIdAndUserId(request.getAddressId(), user.getId())
					.orElseThrow(() -> new BadRequestException("Dia chi da chon khong hop le"));

			request.setReceiverName(savedAddress.getReceiverName());
			request.setReceiverPhone(savedAddress.getPhone());
			request.setShippingAddress(savedAddress.getAddress());
			request.setCity(savedAddress.getCity());
			request.setDistrict(savedAddress.getDistrict());
			request.setWard(savedAddress.getWard());
		}

		if (isBlank(request.getReceiverName()) || isBlank(request.getReceiverPhone()) || isBlank(request.getShippingAddress())
				|| isBlank(request.getCity()) || isBlank(request.getDistrict())) {
			throw new BadRequestException("Thong tin nguoi nhan va dia chi giao hang khong duoc de trong");
		}

		if (request.getPaymentMethod() == null) {
			request.setPaymentMethod(PaymentMethod.COD);
		}

		if (isBlank(request.getReceiverEmail())) {
			request.setReceiverEmail(user.getEmail());
		}

		return request;
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private User getCurrentUser(Principal principal) {
		if (principal == null) {
			throw new UnauthorizedException("Vui long dang nhap");
		}
		return userService.findByEmail(principal.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User", "email", principal.getName()));
	}
}

