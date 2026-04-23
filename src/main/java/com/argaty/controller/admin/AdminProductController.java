package com.argaty.controller.admin;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.ProductRequest;
import com.argaty.dto.request.ProductVariantDTO;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.ProductDetailResponse;
import com.argaty.entity.Product;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.service.BrandService;
import com.argaty.service.CategoryService;
import com.argaty.service.ProductService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller quản lý sản phẩm (Admin) - Đã tối ưu hóa
 */
@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private static final int ADMIN_PRODUCTS_PER_PAGE = 6;

    private final ProductService productService;
    private final CategoryService categoryService;
    private final BrandService brandService;

    // --- LIST ---
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortField).ascending() : Sort.by(sortField).descending();
        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : ADMIN_PRODUCTS_PER_PAGE;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, sort);

        Page<Product> products = productService.filterProducts(q, categoryId, brandId, minPrice, maxPrice, pageRequest);

        Map<String, Object> data = new HashMap<>();
        data.put("products", DtoMapper.toProductPageResponse(products));
        data.put("categories", DtoMapper.toCategoryResponseList(categoryService.findAllActive()));
        data.put("brands", DtoMapper.toBrandResponseList(brandService.findAllActive()));
        Map<String, Object> filters = new HashMap<>();
        filters.put("q", q);
        filters.put("categoryId", categoryId);
        filters.put("brandId", brandId);
        filters.put("minPrice", minPrice);
        filters.put("maxPrice", maxPrice);
        filters.put("sortField", sortField);
        filters.put("sortDir", sortDir);
        filters.put("page", pageIndex);
        filters.put("size", pageSize);
        data.put("filters", filters);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> detail(@PathVariable Long id) {
        Product product = productService.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductDetailResponse(product)));
    }

    // --- CREATE ---
    @PostMapping
    public ResponseEntity<ApiResponse<ProductDetailResponse>> create(@Valid @RequestBody ProductRequest request) {

        try {
            Product product = productService.create(
                    request.getName(),request.getSku(), request.getShortDescription(), request.getDescription(),
                    request.getPrice(), request.getSalePrice(), request.getDiscountPercent(),
                    request.getQuantity(), request.getCategoryId(), request.getBrandId(),
                    request.getIsFeatured(), request.getIsNew(), request.getIsBestSeller(),
                    request.getSpecifications(), request.getMetaTitle(), request.getMetaDescription(),
                    request.getSaleStartDate(), request.getSaleEndDate(),
                    request.getTier1Name(), request.getTier2Name()
            );

            if (request.getImageUrls() != null) {
                for (int i = 0; i < request.getImageUrls().size(); i++) {
                    productService.addImage(product.getId(), request.getImageUrls().get(i), i == 0);
                }
            }

            if (request.getVariants() != null) {
                for (ProductVariantDTO v : request.getVariants()) {
                    if (v == null ||
                            (v.getName() == null || v.getName().trim().isEmpty()) &&
                            (v.getColor() == null || v.getColor().trim().isEmpty()) &&
                            (v.getSize() == null || v.getSize().trim().isEmpty())) {
                        continue;
                    }

                    var savedVariant = productService.addVariant(
                            product.getId(), v.getName(), v.getSku(), v.getColor(), v.getColorCode(),
                            v.getSize(), v.getAdditionalPrice(), v.getQuantity()
                    );
                    if (v.getImageUrls() != null) {
                        for (int j = 0; j < v.getImageUrls().size(); j++) {
                            productService.addVariantImage(savedVariant.getId(), v.getImageUrls().get(j), j == 0);
                        }
                    }
                }
            }

            Product created = productService.findByIdWithDetails(product.getId()).orElse(product);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm sản phẩm thành công", DtoMapper.toProductDetailResponse(created)));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // --- UPDATE ---
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> update(@PathVariable Long id,
                                                                     @Valid @RequestBody ProductRequest request) {

        try {
            Product updated = productService.update(id, request);
            Product detailed = productService.findByIdWithDetails(updated.getId()).orElse(updated);

            return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công",
                    DtoMapper.toProductDetailResponse(detailed)));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        productService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái"));
    }

    @PatchMapping("/{id}/toggle-featured")
    public ResponseEntity<ApiResponse<Void>> toggleFeatured(@PathVariable Long id) {
        productService.toggleFeatured(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái nổi bật"));
    }

    @PatchMapping("/{id}/toggle-new")
    public ResponseEntity<ApiResponse<Void>> toggleNew(@PathVariable Long id) {
        productService.toggleNew(id);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái sản phẩm mới"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            productService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Đã xử lý xóa sản phẩm"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Không thể xóa sản phẩm: " + e.getMessage()));
        }
    }

    @GetMapping("/metadata")
    public ResponseEntity<ApiResponse<Map<String, Object>>> metadata() {
        Map<String, Object> data = new HashMap<>();
        data.put("categories", DtoMapper.toCategoryWithChildrenResponseList(categoryService.findRootCategories()));
        data.put("brands", DtoMapper.toBrandResponseList(brandService.findAllActive()));
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}