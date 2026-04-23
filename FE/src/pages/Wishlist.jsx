import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";

const Wishlist = () => {
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { listWishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      showToast(
        "warning",
        "Cần đăng nhập",
        "Vui lòng đăng nhập để xem danh sách yêu thích",
      );
      navigate("/auth/login", {
        replace: true,
        state: { redirectTo: location.pathname },
      });
      return;
    }

    const loadWishlist = async () => {
      try {
        const data = await listWishlist();
        setWishlistItems(Array.isArray(data) ? data : []);
      } catch {
        setWishlistItems([]);
      }
    };
    loadWishlist();
  }, [
    authLoading,
    isAuthenticated,
    listWishlist,
    location.pathname,
    navigate,
    showToast,
  ]);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setWishlistItems((prev) =>
        prev.filter((item) => item.productId !== productId),
      );
      showToast("success", "Đã xóa", "Ngừng yêu thích sản phẩm");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa khỏi yêu thích",
      );
    }
  };

  const handleAddToCart = async (item) => {
    try {
      await addToCart({ id: item.productId }, 1, null);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể thêm vào giỏ hàng",
      );
    }
  };

  return (
    <div className="wishlist-page section" style={{ padding: "120px 0 80px" }}>
      <div className="container">
        <nav className="breadcrumb mb-8 flex items-center gap-2 text-sm text-muted">
          <Link
            to="/"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <i className="bx bx-home"></i> Trang chủ
          </Link>
          <span>
            <i className="bx bx-chevron-right text-gray-600"></i>
          </span>
          <span className="text-white">Yêu thích</span>
        </nav>

        <div className="section-header text-left mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <i className="bx bxs-heart text-pink-500"></i> Sản phẩm yêu thích
          </h1>
          <p className="text-muted mt-2">
            <span className="text-white font-medium">
              {wishlistItems.length}
            </span>{" "}
            sản phẩm
          </p>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="products-grid">
            {wishlistItems.map((item) => (
              <div
                key={item.productId}
                className="product-card card glass group"
              >
                <div className="product-card__image overflow-hidden relative rounded-t-xl aspect-square">
                  <Link to={`/products/${item.productSlug}`}>
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </Link>

                  <div className="product-card__badges absolute top-3 left-3 flex flex-col gap-2">
                    {item.isOnSale && (
                      <span className="badge bg-red-500/90 text-white px-2 py-1 rounded text-xs font-bold">
                        -{item.discountPercent}%
                      </span>
                    )}
                    {!item.isInStock && (
                      <span className="badge bg-gray-500/90 text-white px-2 py-1 rounded text-xs font-bold">
                        Hết hàng
                      </span>
                    )}
                  </div>

                  <div className="product-card__actions absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-9 h-9 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-pink-500 hover:bg-white/20 transition-colors"
                      onClick={() => handleRemove(item.productId)}
                      title="Xóa khỏi yêu thích"
                    >
                      <i className="bx bxs-heart text-xl"></i>
                    </button>
                  </div>

                  {item.isInStock && (
                    <button
                      className="absolute bottom-3 left-3 right-3 bg-primary/90 text-white py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 hover:bg-primary"
                      onClick={() => handleAddToCart(item)}
                    >
                      <i className="bx bx-cart-add text-lg"></i>
                      <span>Thêm vào giỏ</span>
                    </button>
                  )}
                </div>

                <div className="product-card__info p-4">
                  <h3 className="product-card__name font-medium mb-2 truncate">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {item.productName}
                    </Link>
                  </h3>

                  <div className="product-card__price flex items-center gap-3">
                    <span className="price-current text-cyan font-bold font-heading">
                      {(item.isOnSale
                        ? item.salePrice
                        : item.price
                      ).toLocaleString("vi-VN")}{" "}
                      ₫
                    </span>
                    {item.isOnSale && (
                      <span className="price-original text-muted line-through text-sm">
                        {item.price.toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                  </div>

                  <p className="text-muted text-xs mt-3">
                    Đã thêm{" "}
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state text-center py-20 card glass max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="bx bx-heart text-5xl text-muted"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3">
              Chưa có sản phẩm yêu thích
            </h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Hãy thêm sản phẩm vào danh sách yêu thích để theo dõi và mua sắm
              sau!
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              <i className="bx bx-shopping-bag"></i> Khám phá sản phẩm
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
