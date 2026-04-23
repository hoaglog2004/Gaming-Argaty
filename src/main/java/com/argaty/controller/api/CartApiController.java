package com.argaty.controller.api;

import com.argaty.dto.request.CartItemRequest;
import com.argaty.dto.request.UpdateCartItemRequest;
import com.argaty.dto.response.ApiResponse;
import com.argaty.dto.response.CartItemResponse;
import com.argaty.dto.response.CartResponse;
import com.argaty.entity.Cart;
import com.argaty.entity.CartItem;
import com.argaty.entity.User;
import com.argaty.exception.BadRequestException;
import com.argaty.service.CartService;
import com.argaty.service.UserService;
import com.argaty.util.DtoMapper;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

/**
 * REST API Controller cho giá» hĂ ng
 */
@RestController
@RequestMapping({"/api/cart", "/api/v1/cart"})
@RequiredArgsConstructor
public class CartApiController {

    private final CartService cartService;
    private final UserService userService;

    /**
     * Láº¥y giá» hĂ ng
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(Principal principal, HttpSession session) {
        Cart cart = getOrCreateCart(principal, session);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toCartResponse(cart)));
    }

    /**
     * Láº¥y sá»‘ lÆ°á»£ng items trong giá»
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Integer>> getCartCount(Principal principal, HttpSession session) {
        Cart cart = getOrCreateCart(principal, session);
        return ResponseEntity.ok(ApiResponse.success(cart.getTotalItemCount()));
    }

    /**
     * ThĂªm sáº£n pháº©m vĂ o giá»
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartItemResponse>> addItem(
            @Valid @RequestBody CartItemRequest request,
            Principal principal,
            HttpSession session) {

        try {
            Cart cart = getOrCreateCart(principal, session);
            CartItem item = cartService.addItem(
                    cart.getId(),
                    request.getProductId(),
                    request.getVariantId(),
                    request.getQuantity()
            );
            return ResponseEntity.ok(ApiResponse.success("ÄĂ£ thĂªm vĂ o giá» hĂ ng", 
                    DtoMapper.toCartItemResponse(item)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Cáº­p nháº­t sá»‘ lÆ°á»£ng item
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {

        try {
            CartItem item = cartService.updateItemQuantity(itemId, request.getQuantity());
            return ResponseEntity.ok(ApiResponse.success("ÄĂ£ cáº­p nháº­t giá» hĂ ng", 
                    DtoMapper.toCartItemResponse(item)));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * XĂ³a item khá»i giá»
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(@PathVariable Long itemId) {
        try {
            cartService.removeItem(itemId);
            return ResponseEntity.ok(ApiResponse.success("ÄĂ£ xĂ³a khá»i giá» hĂ ng"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Toggle chá»n item
     */
    @PatchMapping("/items/{itemId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleItem(@PathVariable Long itemId) {
        cartService.toggleItemSelected(itemId);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ cáº­p nháº­t"));
    }

    /**
     * Chá»n/bá» chá»n táº¥t cáº£ items
     */
    @PatchMapping("/select-all")
    public ResponseEntity<ApiResponse<Void>> selectAll(
            @RequestParam boolean selected,
            Principal principal,
            HttpSession session) {

        Cart cart = getOrCreateCart(principal, session);
        cartService.selectAllItems(cart.getId(), selected);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ cáº­p nháº­t"));
    }

    /**
     * XĂ³a toĂ n bá»™ giá» hĂ ng
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(Principal principal, HttpSession session) {
        Cart cart = getOrCreateCart(principal, session);
        cartService.clearCart(cart.getId());
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ xĂ³a giá» hĂ ng"));
    }

    /**
     * Helper:  Láº¥y hoáº·c táº¡o giá» hĂ ng
     */
    private Cart getOrCreateCart(Principal principal, HttpSession session) {
        if (principal != null) {
            User user = userService.findByEmail(principal.getName())
                    .orElseThrow(() -> new com.argaty.exception.ResourceNotFoundException("User", "email", principal.getName()));
            return cartService.getOrCreateCart(user.getId());
        } else {
            String sessionId = (String) session.getAttribute("CART_SESSION_ID");
            if (sessionId == null) {
                sessionId = UUID.randomUUID().toString();
                session.setAttribute("CART_SESSION_ID", sessionId);
            }
            return cartService.getOrCreateCartBySession(sessionId);
        }
    }
}
