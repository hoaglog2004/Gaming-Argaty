/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useToast } from "./ToastContext";
import apiClient, { unwrapApiResponse } from "../services/apiClient";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const cartItemCount = items.length;
  const cartTotalAmount = items
    .filter((i) => i.isSelected)
    .reduce((sum, i) => sum + Number(i.subtotal || 0), 0);
  const selectedItemsCount = items.filter((i) => i.isSelected).length;

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/cart");
      const data = unwrapApiResponse(response) || {};
      setItems(data.items || []);
      return data;
    } catch {
      setItems([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (product, quantity = 1, variant = null) => {
      try {
        await apiClient.post("/cart/items", {
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity,
        });
        await refreshCart();
        showToast("success", "Thành công", "Đã thêm vào giỏ hàng");
      } catch (error) {
        showToast(
          "error",
          "Lỗi",
          error?.response?.data?.message || "Không thể thêm vào giỏ hàng",
        );
      }
    },
    [refreshCart, showToast],
  );

  const updateQuantity = useCallback(
    async (id, newQuantity) => {
      const item = items.find((x) => x.id === id);
      if (!item) return;
      const validQuantity = Math.max(
        1,
        Math.min(
          newQuantity,
          Number(item.availableQuantity || newQuantity || 1),
        ),
      );
      try {
        await apiClient.put(`/cart/items/${id}`, { quantity: validQuantity });
        await refreshCart();
      } catch (error) {
        showToast(
          "error",
          "Lỗi",
          error?.response?.data?.message || "Không thể cập nhật số lượng",
        );
      }
    },
    [items, refreshCart, showToast],
  );

  const toggleSelect = useCallback(
    async (id) => {
      try {
        await apiClient.patch(`/cart/items/${id}/toggle`);
        await refreshCart();
      } catch (error) {
        showToast(
          "error",
          "Lỗi",
          error?.response?.data?.message || "Không thể cập nhật lựa chọn",
        );
      }
    },
    [refreshCart, showToast],
  );

  const toggleSelectAll = useCallback(
    async (isSelected) => {
      try {
        await apiClient.patch(
          `/cart/select-all?selected=${Boolean(isSelected)}`,
        );
        await refreshCart();
      } catch (error) {
        showToast(
          "error",
          "Lỗi",
          error?.response?.data?.message || "Không thể chọn tất cả",
        );
      }
    },
    [refreshCart, showToast],
  );

  const removeItem = useCallback(
    async (id) => {
      if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
      try {
        await apiClient.delete(`/cart/items/${id}`);
        await refreshCart();
        showToast("success", "Thành công", "Đã xóa sản phẩm khỏi giỏ hàng");
      } catch (error) {
        showToast(
          "error",
          "Lỗi",
          error?.response?.data?.message || "Không thể xóa sản phẩm",
        );
      }
    },
    [refreshCart, showToast],
  );

  const clearCart = useCallback(async () => {
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) return;
    try {
      await apiClient.delete("/cart");
      await refreshCart();
      showToast("success", "Thành công", "Đã xóa giỏ hàng");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa giỏ hàng",
      );
    }
  }, [refreshCart, showToast]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartItemCount,
        cartTotalAmount,
        selectedItemsCount,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        toggleSelect,
        toggleSelectAll,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
