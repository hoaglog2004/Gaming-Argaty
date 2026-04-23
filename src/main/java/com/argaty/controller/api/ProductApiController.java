package com.argaty.controller.api;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.PageResponse;
import com.argaty.dto.response.ProductDetailResponse;
import com.argaty.dto.response.ProductResponse;
import com.argaty.entity.Product;
import com.argaty.exception.ResourceNotFoundException;
import com.argaty.service.ProductService;
import com.argaty.util.DtoMapper;

import lombok.RequiredArgsConstructor;

/**
 * REST API Controller cho san pham (public)
 */
@RestController
@RequestMapping({"/api/products", "/api/v1/products"})
@RequiredArgsConstructor
public class ProductApiController {

    private final ProductService productService;

    /**
        * Lay danh sach san pham
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Sort sortOrder = createSort(sort);
        PageRequest pageRequest = PageRequest.of(page, size, sortOrder);

        Page<Product> products;

        if (q != null && !q.trim().isEmpty()) {
            products = productService.search(q.trim(), pageRequest);
        } else if (categoryId != null) {
            products = productService.findByCategory(categoryId, pageRequest);
        } else if (brandId != null) {
            products = productService.findByBrand(brandId, pageRequest);
        } else if (minPrice != null || maxPrice != null) {
            BigDecimal min = minPrice != null ? minPrice : BigDecimal.ZERO;
            BigDecimal max = maxPrice != null ? maxPrice : BigDecimal.valueOf(Long.MAX_VALUE);
            products = productService.findByPriceRange(min, max, pageRequest);
        } else {
            products = productService.findActiveProducts(pageRequest);
        }

        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductPageResponse(products)));
    }

    /**
        * Lay chi tiet san pham theo slug
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductBySlug(@PathVariable String slug) {
        Product product = productService.findBySlugWithDetails(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "slug", slug));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductDetailResponse(product)));
    }

    /**
        * Lay san pham noi bat
     */
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts(
            @RequestParam(defaultValue = "8") int limit) {

        List<Product> products = productService.findFeaturedProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductResponseList(products)));
    }

    /**
        * Lay san pham moi
     */
    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewProducts(
            @RequestParam(defaultValue = "8") int limit) {

        List<Product> products = productService.findNewProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductResponseList(products)));
    }

    /**
        * Lay san pham ban chay
     */
    @GetMapping("/bestseller")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBestSellerProducts(
            @RequestParam(defaultValue = "8") int limit) {

        List<Product> products = productService.findBestSellerProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductResponseList(products)));
    }

    /**
        * Lay san pham dang sale
     */
    @GetMapping("/sale")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getSaleProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Page<Product> products = productService.findOnSale(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductPageResponse(products)));
    }

    /**
        * Lay san pham lien quan
     */
    @GetMapping("/{productId}/related")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getRelatedProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "4") int limit) {

        List<Product> products = productService.findRelatedProducts(productId, limit);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductResponseList(products)));
    }

    /**
        * Tim kiem goi y (autocomplete)
     */
    @GetMapping("/search/suggestions")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> searchSuggestions(
            @RequestParam String q) {

        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }

        Page<Product> products = productService.search(q.trim(), PageRequest.of(0, 5));
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toProductResponseList(products.getContent())));
    }

    private Sort createSort(String sort) {
        return switch (sort) {
            case "price-asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price-desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name-asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name-desc" -> Sort.by(Sort.Direction.DESC, "name");
            case "bestseller" -> Sort.by(Sort.Direction.DESC, "soldCount");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
