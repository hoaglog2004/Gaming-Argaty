package com.argaty.controller.api;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.argaty.dto.request.AddressRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.UserAddressResponse;
import com.argaty.entity.User;
import com.argaty.entity.UserAddress;
import com.argaty.exception.BadRequestException;
import com.argaty.service.UserAddressService;
import com.argaty.service.UserService;
import com.argaty.util.DtoMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST API Controller cho Ä‘á»‹a chá»‰
 */
@RestController
@RequestMapping({"/api/addresses", "/api/v1/addresses"})
@RequiredArgsConstructor
public class AddressApiController {

    private final UserAddressService userAddressService;
    private final UserService userService;

    /**
     * Láº¥y danh sĂ¡ch Ä‘á»‹a chá»‰
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserAddressResponse>>> getAddresses(Principal principal) {
        User user = getCurrentUser(principal);
        List<UserAddress> addresses = userAddressService.findByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toUserAddressResponseList(addresses)));
    }

    /**
     * Láº¥y Ä‘á»‹a chá»‰ máº·c Ä‘á»‹nh
     */
    @GetMapping("/default")
    public ResponseEntity<ApiResponse<UserAddressResponse>> getDefaultAddress(Principal principal) {
        User user = getCurrentUser(principal);
        UserAddress address = userAddressService.findDefaultAddress(user.getId()).orElse(null);
        
        if (address == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toUserAddressResponse(address)));
    }

    /**
     * Láº¥y chi tiáº¿t Ä‘á»‹a chá»‰
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserAddressResponse>> getAddress(
            @PathVariable Long id,
            Principal principal) {

        User user = getCurrentUser(principal);
        UserAddress address = userAddressService.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("Address", "id", id));

        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toUserAddressResponse(address)));
    }

    /**
     * Táº¡o Ä‘á»‹a chá»‰ má»›i
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserAddressResponse>> createAddress(
            @Valid @RequestBody AddressRequest request,
            Principal principal) {

        User user = getCurrentUser(principal);

        try {
            UserAddress address = userAddressService.create(
                    user.getId(),
                    request.getReceiverName(),
                    request.getPhone(),
                    request.getAddress(),
                    request.getCity(),
                    request.getDistrict(),
                    request.getWard(),
                    request.getIsDefault() != null && request.getIsDefault()
            );
            return ResponseEntity.ok(ApiResponse.success("ThĂªm Ä‘á»‹a chá»‰ thĂ nh cĂ´ng", 
                    DtoMapper.toUserAddressResponse(address)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Cáº­p nháº­t Ä‘á»‹a chá»‰
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserAddressResponse>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request,
            Principal principal) {

        User user = getCurrentUser(principal);

        try {
            UserAddress address = userAddressService.update(
                    id,
                    user.getId(),
                    request.getReceiverName(),
                    request.getPhone(),
                    request.getAddress(),
                    request.getCity(),
                    request.getDistrict(),
                    request.getWard(),
                    request.getIsDefault() != null && request.getIsDefault()
            );
            return ResponseEntity.ok(ApiResponse.success("Cáº­p nháº­t Ä‘á»‹a chá»‰ thĂ nh cĂ´ng", 
                    DtoMapper.toUserAddressResponse(address)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * XĂ³a Ä‘á»‹a chá»‰
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            Principal principal) {

        User user = getCurrentUser(principal);

        try {
            userAddressService.deleteById(id, user.getId());
            return ResponseEntity.ok(ApiResponse.success("ÄĂ£ xĂ³a Ä‘á»‹a chá»‰"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Set Ä‘á»‹a chá»‰ máº·c Ä‘á»‹nh
     */
    @PatchMapping("/{id}/default")
    public ResponseEntity<ApiResponse<Void>> setDefault(
            @PathVariable Long id,
            Principal principal) {

        User user = getCurrentUser(principal);
        userAddressService.setDefaultAddress(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ Ä‘áº·t lĂ m Ä‘á»‹a chá»‰ máº·c Ä‘á»‹nh"));
    }

    private User getCurrentUser(Principal principal) {
        if (principal == null) {
            throw new com.argaty.exception.UnauthorizedException("Vui lĂ²ng Ä‘Äƒng nháº­p");
        }
        return userService.findByEmail(principal.getName())
                .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "email", principal.getName()));
    }
}
