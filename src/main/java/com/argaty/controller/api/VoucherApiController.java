package com.argaty.controller.api;

import com.argaty.dto.request.ApplyVoucherRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.VoucherResponse;
import com.argaty.entity.User;
import com.argaty.entity.Voucher;
import com.argaty.exception.BadRequestException;
import com.argaty.service.CartService;
import com.argaty.service.UserService;
import com.argaty.service.VoucherService;
import com.argaty.util.DtoMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller cho voucher
 */
@RestController
@RequestMapping({"/api/vouchers", "/api/v1/vouchers"})
@RequiredArgsConstructor
public class VoucherApiController {

    private final VoucherService voucherService;
    private final UserService userService;
    private final CartService cartService;

    /**
     * Láº¥y vouchers kháº£ dá»¥ng cho user
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getAvailableVouchers(
            @RequestParam(required = false) BigDecimal orderAmount,
            Principal principal) {

        User user = getCurrentUser(principal);
        
        BigDecimal amount = orderAmount;
        if (amount == null) {
            // Láº¥y tá»« giá» hĂ ng
            var cart = cartService.findByUserId(user.getId());
            amount = cart.map(c -> c.getTotalAmount()).orElse(BigDecimal.ZERO);
        }

        List<Voucher> vouchers = voucherService.findVouchersForUser(user.getId(), amount);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toVoucherResponseList(vouchers)));
    }

    /**
     * Kiá»ƒm tra vĂ  tĂ­nh toĂ¡n voucher
     */
    @PostMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkVoucher(
            @Valid @RequestBody ApplyVoucherRequest request,
            @RequestParam BigDecimal orderAmount,
            Principal principal) {

        User user = getCurrentUser(principal);

        try {
            // Kiá»ƒm tra voucher há»£p lá»‡
            if (!voucherService.canUserUseVoucher(request.getCode(), user.getId())) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.error("MĂ£ voucher khĂ´ng há»£p lá»‡ hoáº·c Ä‘Ă£ háº¿t lÆ°á»£t sá»­ dá»¥ng"));
            }

            // TĂ­nh sá»‘ tiá»n giáº£m
            BigDecimal discount = voucherService.calculateDiscount(request.getCode(), orderAmount);
            Voucher voucher = voucherService.findByCode(request.getCode())
                    .orElseThrow(() -> new BadRequestException("Voucher khĂ´ng tá»“n táº¡i"));

            Map<String, Object> data = new HashMap<>();
            data.put("voucher", VoucherResponse.fromEntity(voucher));
            data.put("discountAmount", discount);
            data.put("finalAmount", orderAmount.subtract(discount));

            return ResponseEntity.ok(ApiResponse.success("Ăp dá»¥ng voucher thĂ nh cĂ´ng", data));

        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Láº¥y thĂ´ng tin voucher theo code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucherByCode(@PathVariable String code) {
        Voucher voucher = voucherService.findByCode(code)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("Voucher", "code", code));

        return ResponseEntity.ok(ApiResponse.success(VoucherResponse.fromEntity(voucher)));
    }

    private User getCurrentUser(Principal principal) {
        if (principal == null) {
            throw new com.argaty.exception.UnauthorizedException("Vui lĂ²ng Ä‘Äƒng nháº­p");
        }
        return userService.findByEmail(principal.getName())
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "email", principal.getName()));
    }
}
