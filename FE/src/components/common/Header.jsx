import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { catalogApi } from "../../services/apiServices";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);

  // Lấy dữ liệu thực từ context
  const { items: cartItems, cartItemCount, cartTotalAmount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const hasAdminAccess = Boolean(user?.canAccessAdmin);
  const userInitial = (user?.fullName || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const trimmedKeyword = useMemo(() => searchKeyword.trim(), [searchKeyword]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (trimmedKeyword.length < 2) return;
        const result = await catalogApi.searchSuggestions(trimmedKeyword);
        setSuggestions(Array.isArray(result) ? result : []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [trimmedKeyword]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      setShowSuggestions(false);
      navigate(`/products/${suggestions[selectedIndex].slug}`);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!trimmedKeyword) return;
    setShowSuggestions(false);
    navigate(`/products?q=${encodeURIComponent(trimmedKeyword)}&page=0`);
  };

  return (
    <header className="header" id="header">
      <div className="container">
        <div className="header__inner">
          <Link to="/" className="header__logo">
            <div className="header__logo-icon">
              <i className="bx bx-planet"></i>
            </div>
            <span className="header__logo-text">ARGATY</span>
          </Link>

          <nav className={`header__nav ${isMobileMenuOpen ? "active" : ""}`}>
            <Link to="/" className={`nav-link ${isActive("/")}`}>
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={`nav-link ${isActive("/products")}`}
            >
              Sản phẩm
            </Link>
            <Link to="/about" className={`nav-link ${isActive("/about")}`}>
              Giới thiệu
            </Link>
            <Link to="/contact" className={`nav-link ${isActive("/contact")}`}>
              Liên hệ
            </Link>
          </nav>

          <div className="header__search">
            <form className="header__search-form" onSubmit={handleSearchSubmit}>
              <i className="bx bx-search header__search-icon"></i>
              <input
                type="text"
                className="header__search-input"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchKeyword}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearchKeyword(next);
                  if (next.trim().length < 2) {
                    setSuggestions([]);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              <button type="submit" className="header__search-btn">
                <i className="bx bx-search"></i>
              </button>
            </form>

            {showSuggestions && trimmedKeyword.length >= 2 && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "8px",
                  zIndex: 1000,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => {
                      setShowSuggestions(false);
                      navigate(`/products/${item.slug}`);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "none",
                      background: selectedIndex === index ? "var(--bg-hover, rgba(0,0,0,0.05))" : "transparent",
                      color: "var(--text-primary)",
                      padding: "8px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <img
                      src={item.mainImage || "/images/no-image.png"}
                      alt={item.name}
                      style={{
                        width: "36px",
                        height: "36px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                    <span style={{ fontSize: "13px" }}>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="header__actions">
            <Link
              to="/wishlist"
              className="header__action-btn btn-wishlist"
              title="Yêu thích"
            >
              <i className="bx bx-heart"></i>
              {wishlistCount > 0 && (
                <span className="badge-count">{wishlistCount}</span>
              )}
            </Link>

            <div
              className={`header__action-item header__cart-wrapper ${isCartOpen ? "is-open" : ""}`}
              onMouseEnter={() => setIsCartOpen(true)}
              onMouseLeave={() => setIsCartOpen(false)}
            >
              <Link
                to="/cart"
                className="header__action-btn btn-cart"
                title="Giỏ hàng"
              >
                <i className="bx bx-cart"></i>
                {cartItemCount > 0 && (
                  <span className="badge-count">{cartItemCount}</span>
                )}
              </Link>

              <div className="header__cart-dropdown">
                <div className="header__cart-header">
                  <span>
                    {cartItemCount > 0 ? "Sản phẩm đang có" : "Giỏ hàng trống"}
                  </span>
                </div>

                {cartItemCount > 0 ? (
                  <>
                    <div className="header__cart-items">
                      {cartItems.map((item) => (
                        <div key={item.id} className="header__cart-item">
                          <img
                            src={item.productImage}
                            alt="Product"
                            className="header__cart-img"
                          />
                          <div className="header__cart-info">
                            <Link
                              to={`/products/${item.productSlug}`}
                              className="header__cart-name"
                            >
                              {item.productName}
                            </Link>
                            <div className="header__cart-price">
                              <span>{item.quantity}</span> x{" "}
                              <span>
                                {Number(item.unitPrice || 0).toLocaleString(
                                  "vi-VN",
                                )}{" "}
                                ₫
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="header__cart-footer">
                      <div className="header__cart-total">
                        <span>Tổng cộng:</span>
                        <span className="header__cart-total-price">
                          {Number(cartTotalAmount || 0).toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                      <Link
                        to="/cart"
                        className="btn btn-primary btn-block btn-sm"
                      >
                        Xem giỏ hàng
                      </Link>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      padding: "30px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <i
                      className="bx bx-cart"
                      style={{
                        fontSize: "40px",
                        marginBottom: "10px",
                        opacity: 0.5,
                      }}
                    ></i>
                    <p>Chưa có sản phẩm nào</p>
                  </div>
                )}
              </div>
            </div>

            {!isAuthenticated ? (
              <Link
                to="/auth/login"
                className="btn btn-primary btn-sm"
                style={{ borderRadius: "20px" }}
              >
                <i className="bx bx-log-in"></i> <span>Đăng nhập</span>
              </Link>
            ) : (
              <div className="header__user">
                <div className="header__dropdown">
                  <div className="header__user-btn" role="button">
                    <div className="header__user-avatar">
                      {user?.avatar && failedAvatarUrl !== user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Avatar"
                          onError={() => setFailedAvatarUrl(user.avatar)}
                        />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <span className="header__username">
                      {user?.fullName || user?.email || "Tài khoản"}
                    </span>
                    <i className="bx bx-chevron-down"></i>
                  </div>

                  <div className="header__dropdown-menu">
                    {hasAdminAccess ? (
                      <Link to="/admin" className="header__dropdown-item">
                        <i className="bx bx-shield-quarter"></i> Quản lý admin
                      </Link>
                    ) : null}
                    <Link to="/profile" className="header__dropdown-item">
                      <i className="bx bx-user-circle"></i> Hồ sơ
                    </Link>
                    <Link
                      to="/profile/orders"
                      className="header__dropdown-item"
                    >
                      <i className="bx bx-package"></i> Đơn hàng
                    </Link>
                    <div className="header__dropdown-divider"></div>
                    <button
                      className="header__dropdown-item header__logout-btn"
                      onClick={logout}
                    >
                      <i className="bx bx-log-out"></i> Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              className="header__mobile-toggle"
              id="mobileMenuToggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <i className={`bx ${isMobileMenuOpen ? "bx-x" : "bx-menu"}`}></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
