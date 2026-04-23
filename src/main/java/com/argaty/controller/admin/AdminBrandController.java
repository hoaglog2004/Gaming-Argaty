package com.argaty.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.BrandRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.BrandResponse;
import com.argaty.entity.Brand;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.service.BrandService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller quản lý thương hiệu (Admin)
 */
@RestController
@RequestMapping("/api/v1/admin/brands")
@RequiredArgsConstructor
public class AdminBrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by("displayOrder").ascending());

        Page<Brand> brands;
        if (q != null && !q.trim().isEmpty()) {
            brands = brandService.search(q.trim(), pageRequest);
        } else {
            brands = brandService.findAll(pageRequest);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("brands", brands.map(DtoMapper::toBrandResponse));
        data.put("searchKeyword", q);
        data.put("page", pageIndex);
        data.put("size", pageSize);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> detail(@PathVariable Long id) {
        Brand brand = brandService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", id));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toBrandResponse(brand)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BrandResponse>> create(@Valid @RequestBody BrandRequest request) {

        try {
            Brand created = brandService.create(
                    request.getName(),
                    request.getSlug(),
                    request.getLogo(),
                    request.getDescription(),
                    request.getIsActive()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm thương hiệu thành công", DtoMapper.toBrandResponse(created)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> update(@PathVariable Long id,
                                                              @Valid @RequestBody BrandRequest request) {

        try {
            Brand existingBrand = brandService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Brand", "id", id));

            String logoUrl = request.getLogo() != null ? request.getLogo() : existingBrand.getLogo();

            Brand updated = brandService.update(
                    id,
                    request.getName(),
                    request.getSlug(),
                    logoUrl,
                    request.getDescription(),
                    request.getIsActive()
            );

            return ResponseEntity.ok(ApiResponse.success("Cập nhật thương hiệu thành công",
                    DtoMapper.toBrandResponse(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        brandService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            brandService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Đã xóa thương hiệu"));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}