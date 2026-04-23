package com.argaty.controller.admin;

import com.argaty.dto.request.VoucherRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.Voucher;
import com.argaty.exception.BadRequestException;
import com.argaty.service.VoucherService;
import com.argaty.util.DtoMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller quản lý voucher (Admin)
 */
@RestController
@RequestMapping("/api/v1/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Voucher> vouchers;
        if (q != null && !q.trim().isEmpty()) {
            vouchers = voucherService.search(q.trim(), pageRequest);
        } else {
            vouchers = voucherService.findAll(pageRequest);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("vouchers", vouchers.map(DtoMapper::toVoucherResponse));
        data.put("searchKeyword", q);
        data.put("page", pageIndex);
        data.put("size", pageSize);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> detail(@PathVariable Long id) {
        Voucher voucher = voucherService.findById(id)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("Voucher", "id", id));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toVoucherResponse(voucher)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody VoucherRequest request) {

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate()) ||
                request.getEndDate().isEqual(request.getStartDate())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Ngày kết thúc phải sau ngày bắt đầu"));
            }
        }

        try {
            Voucher created = voucherService.create(
                    request.getCode(),
                    request.getName(),
                    request.getDescription(),
                    request.getDiscountType(),
                    request.getDiscountValue(),
                    request.getMaxDiscount(),
                    request.getMinOrderAmount(),
                    request.getUsageLimit(),
                    request.getUsageLimitPerUser(),
                    request.getStartDate(),
                    request.getEndDate(),
                    request.getIsActive()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm voucher thành công", DtoMapper.toVoucherResponse(created)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id,
                                                 @Valid @RequestBody VoucherRequest request) {

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate()) ||
                request.getEndDate().isEqual(request.getStartDate())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Ngày kết thúc phải sau ngày bắt đầu"));
            }
        }

        try {
            Voucher updated = voucherService.update(
                    id,
                    request.getName(),
                    request.getDescription(),
                    request.getDiscountType(),
                    request.getDiscountValue(),
                    request.getMaxDiscount(),
                    request.getMinOrderAmount(),
                    request.getUsageLimit(),
                    request.getUsageLimitPerUser(),
                    request.getStartDate(),
                    request.getEndDate(),
                    request.getIsActive()
            );

            return ResponseEntity.ok(ApiResponse.success("Cập nhật voucher thành công",
                    DtoMapper.toVoucherResponse(updated)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        voucherService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            voucherService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Đã xóa voucher"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Không thể xóa voucher"));
        }
    }
}