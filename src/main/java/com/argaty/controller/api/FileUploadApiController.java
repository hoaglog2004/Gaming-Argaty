package com.argaty.controller.api;

import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.FileUploadResponse;
import com.argaty.exception.BadRequestException;
import com.argaty.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

/**
 * REST API Controller cho upload file
 */
@RestController
@RequestMapping({"/api/files", "/api/v1/files"})
@RequiredArgsConstructor
public class FileUploadApiController {

    private final FileStorageService fileStorageService;

    /**
     * Upload single file
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String directory,
            Principal principal) {

        // YĂªu cáº§u Ä‘Äƒng nháº­p
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lĂ²ng Ä‘Äƒng nháº­p"));
        }

        try {
            String url = fileStorageService.uploadFile(file, directory + "/");
            return ResponseEntity.ok(ApiResponse.success("Upload thĂ nh cĂ´ng", 
                    FileUploadResponse.success(url)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Upload multiple files
     */
    @PostMapping("/upload-multiple")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadMultipleFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(defaultValue = "general") String directory,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lĂ²ng Ä‘Äƒng nháº­p"));
        }

        if (files.size() > 10) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chá»‰ Ä‘Æ°á»£c upload tá»‘i Ä‘a 10 files"));
        }

        try {
            List<String> urls = fileStorageService.uploadFiles(files, directory + "/");
            return ResponseEntity.ok(ApiResponse.success("Upload thĂ nh cĂ´ng", 
                    FileUploadResponse.success(urls)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Upload áº£nh sáº£n pháº©m (Admin)
     */
    @PostMapping("/upload/product")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        return uploadFile(file, "products", principal);
    }

    /**
     * Upload avatar
     */
    @PostMapping("/upload/avatar")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        return uploadFile(file, "avatars", principal);
    }

    /**
     * Upload áº£nh review
     */
    @PostMapping("/upload/review")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadReviewImage(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        return uploadFile(file, "reviews", principal);
    }

    /**
     * Upload banner (Admin)
     */
    @PostMapping("/upload/banner")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadBanner(
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        return uploadFile(file, "banners", principal);
    }

    /**
     * XĂ³a file
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @RequestParam String path,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lĂ²ng Ä‘Äƒng nháº­p"));
        }

        fileStorageService.deleteFile(path);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ xĂ³a file"));
    }
}
