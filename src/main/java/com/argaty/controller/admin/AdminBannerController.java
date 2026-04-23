package com.argaty.controller.admin;

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

import com.argaty.dto.request.BannerRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.Banner;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.service.BannerService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller quản lý banner (Admin)
 */
@RestController
@RequestMapping("/api/v1/admin/banners")
@RequiredArgsConstructor
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) String position,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by("displayOrder").ascending());

        Page<Banner> banners = bannerService.findAll(pageRequest);

        Map<String, Object> data = new HashMap<>();
        data.put("banners", banners.map(DtoMapper::toBannerResponse));
        data.put("position", position);
        data.put("positions", new String[]{
                Banner.POSITION_HOME_SLIDER,
                Banner.POSITION_HOME_BANNER,
                Banner.POSITION_PRODUCT_BANNER,
                Banner.POSITION_POPUP
        });

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> detail(@PathVariable Long id) {
        Banner banner = bannerService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner", "id", id));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toBannerResponse(banner)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody BannerRequest request) {

        try {
            if (request.getImageUrl() == null || request.getImageUrl().isEmpty()) {
                throw new BadRequestException("Vui lòng chọn hình ảnh cho banner mới!");
            }

            Banner created = bannerService.create(
                    request.getTitle(),
                    request.getSubtitle(),
                    request.getImageUrl(),
                    request.getLink(),
                    request.getPosition(),
                    request.getDisplayOrder(),
                    request.getStartDate(),
                    request.getEndDate()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm banner thành công", DtoMapper.toBannerResponse(created)));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id,
                                                 @Valid @RequestBody BannerRequest request) {

        try {
            Banner existing = bannerService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Banner", "id", id));

            String imageUrl = request.getImageUrl() != null ? request.getImageUrl() : existing.getImageUrl();

            Banner updated = bannerService.update(
                    id,
                    request.getTitle(),
                    request.getSubtitle(),
                    imageUrl,
                    request.getLink(),
                    request.getPosition(),
                    request.getDisplayOrder(),
                    request.getStartDate(),
                    request.getEndDate()
            );

            return ResponseEntity.ok(ApiResponse.success("Cập nhật banner thành công",
                    DtoMapper.toBannerResponse(updated)));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        bannerService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            bannerService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Đã xóa banner"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Không thể xóa banner"));
        }
    }
}