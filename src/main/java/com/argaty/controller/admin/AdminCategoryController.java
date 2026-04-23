package com.argaty.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
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

import com.argaty.dto.request.CategoryRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.CategoryResponse;
import com.argaty.entity.Category;
import com.argaty.exception.BadRequestException;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.service.CategoryService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(@RequestParam(required = false) String q,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "20") int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by("displayOrder").ascending());
        Page<Category> categories;
        
        if (q != null && !q.trim().isEmpty()) {
            categories = categoryService.search(q.trim(), pageRequest);
        } else {
            categories = categoryService.findAll(pageRequest);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("categories", DtoMapper.toCategoryPageResponse(categories));
        data.put("searchKeyword", q);
        data.put("page", pageIndex);
        data.put("size", pageSize);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> detail(@PathVariable Long id) {
        Category category = categoryService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toCategoryResponse(category)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {

        try {
            Category category = categoryService.create(
                    request.getName(),
                    request.getDescription(),
                    request.getImage(),
                    request.getIcon(),
                    request.getParentId()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm danh mục thành công", DtoMapper.toCategoryResponse(category)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(@PathVariable Long id,
                                                                @Valid @RequestBody CategoryRequest request) {

        try {
            Category oldCategory = categoryService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

            String imageUrl = request.getImage() != null ? request.getImage() : oldCategory.getImage();

            Category updated = categoryService.update(
                    id,
                    request.getName(),
                    request.getDescription(),
                    imageUrl,
                    request.getIcon(),
                    request.getParentId()
            );

            return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công",
                    DtoMapper.toCategoryResponse(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        categoryService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái hoạt động"));
    }

    @PatchMapping("/{id}/toggle-featured")
    public ResponseEntity<ApiResponse<Void>> toggleFeatured(@PathVariable Long id) {
        categoryService.toggleFeatured(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái nổi bật"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            categoryService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công!"));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Không thể xóa! Danh mục này đang chứa sản phẩm hoặc danh mục con."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @GetMapping("/metadata")
    public ResponseEntity<ApiResponse<Map<String, Object>>> metadata() {
        Map<String, Object> data = new HashMap<>();
        data.put("parentCategories", DtoMapper.toCategoryResponseList(categoryService.findAllActive()));
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}