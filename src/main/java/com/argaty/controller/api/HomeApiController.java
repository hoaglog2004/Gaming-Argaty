package com.argaty.controller.api;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.response.ApiResponse;
import com.argaty.service.BannerService;
import com.argaty.service.BrandService;
import com.argaty.service.CategoryService;
import com.argaty.service.ProductService;
import com.argaty.util.DtoMapper;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping({"/api/home", "/api/v1/home"})
@RequiredArgsConstructor
public class HomeApiController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final BrandService brandService;
    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> homeData() {
        Map<String, Object> data = new HashMap<>();

        data.put("sliderBanners", DtoMapper.toBannerResponseList(bannerService.findActiveByPosition("HOME_SLIDER")));
        data.put("featuredCategories", DtoMapper.toCategoryResponseList(categoryService.findFeaturedCategories()));
        data.put("brands", DtoMapper.toBrandResponseList(brandService.findBrandsWithProducts()));

        data.put("featuredProducts", DtoMapper.toProductResponseList(productService.findFeaturedProducts(12)));
        data.put("newProducts", DtoMapper.toProductResponseList(productService.findNewProducts(12)));
        data.put("bestSellerProducts", DtoMapper.toProductResponseList(productService.findBestSellerProducts(12)));

        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
