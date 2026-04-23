package com.argaty.controller.admin;

import com.argaty.dto.request.ReviewReplyRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.entity.Review;
import com.argaty.entity.User;
import com.argaty.service.ReviewService;
import com.argaty.service.UserService;
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

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 20;
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> reviews = reviewService.searchReviews(productId, keyword, rating, status, pageRequest);

        Map<String, Object> data = new HashMap<>();
        data.put("reviews", DtoMapper.toReviewPageResponse(reviews));
        data.put("productId", productId);
        data.put("searchKeyword", keyword);
        data.put("selectedRating", rating);
        data.put("selectedStatus", status);
        data.put("page", pageIndex);
        data.put("size", pageSize);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> detail(@PathVariable Long id) {
        Review review = reviewService.findById(id)
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("Review", "id", id));

        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toReviewResponse(review)));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<Void>> reply(@PathVariable Long id,
                                                   @Valid @RequestBody ReviewReplyRequest request,
                                                   Principal principal) {
        try {
            User admin = userService.findByEmail(principal.getName()).orElseThrow();
            reviewService.replyToReview(id, admin.getId(), request.getReply());
            return ResponseEntity.ok(ApiResponse.success("Đã phản hồi đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long id) {
        try {
            reviewService.approveReview(id);
            return ResponseEntity.ok(ApiResponse.success("Đã duyệt đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long id) {
        try {
            reviewService.rejectReview(id);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Lỗi: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            reviewService.deleteById(id);
            return ResponseEntity.ok(ApiResponse.success("Đã xóa đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Không thể xóa đánh giá"));
        }
    }
}