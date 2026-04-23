import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../../assets/css/admin.css";

const AdminLayout = () => {
  const { showToast } = useToast();
  const { user, isAuthenticated, loading, logout, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const warnedRef = useRef(false);
  const userMenuRef = useRef(null);

  const hasAdminAccess = Boolean(user?.canAccessAdmin);

  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => {
      document.body.classList.remove("admin-body");
    };
  }, []);

  const handleLogout = () => {
    logout();
    showToast("info", "Đăng xuất", "Chuyển về trang đăng nhập");
    navigate("/auth/login");
  };

  useEffect(() => {
    refreshMe();
    // Force sync user-role with current token when entering admin routes.
  }, [refreshMe]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      if (warnedRef.current) return;
      warnedRef.current = true;
      showToast(
        "warning",
        "Cần đăng nhập",
        "Vui lòng đăng nhập để truy cập trang quản trị",
      );
      navigate("/auth/login", {
        replace: true,
        state: { redirectTo: "/admin" },
      });
      return;
    }

    if (!hasAdminAccess) {
      if (warnedRef.current) return;
      warnedRef.current = true;
      showToast(
        "error",
        "Không có quyền",
        "Tài khoản hiện tại không có quyền quản trị",
      );
      logout();
      navigate("/auth/login", { replace: true });
    }
  }, [loading, isAuthenticated, hasAdminAccess, navigate, showToast, logout]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  if (loading || !isAuthenticated || !hasAdminAccess) {
    return (
      <div
        className="admin-layout"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div className="text-muted">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  return (
    <>
      <div className="cosmic-bg" style={{ opacity: 0.5 }}>
        <div className="stars"></div>
        <div className="nebula nebula-1"></div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar" id="adminSidebar">
          <div className="admin-sidebar__header">
            <Link
              to="/admin"
              className="admin-sidebar__logo text-decoration-none"
            >
              <div className="admin-sidebar__logo-icon">
                <i className="bx bx-planet"></i>
              </div>
              <span className="admin-sidebar__logo-text">ARGATY</span>
            </Link>
          </div>

          <div className="admin-sidebar__nav">
            <span className="admin-nav__separator">Quản lý chung</span>

            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bxs-dashboard"></i> <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-package"></i> <span>Đơn hàng</span>
              <span className="admin-nav__badge bg-danger">15</span>
            </NavLink>

            <NavLink
              to="/admin/chats"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-conversation"></i> <span>Chat hỗ trợ</span>
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-box"></i> <span>Sản phẩm</span>
            </NavLink>

            <NavLink
              to="/admin/categories"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-category"></i> <span>Danh mục</span>
            </NavLink>

            <NavLink
              to="/admin/brands"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-certification"></i> <span>Thương hiệu</span>
            </NavLink>

            <span className="admin-nav__separator mt-3">Kinh doanh</span>

            {/* <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-megaphone"></i> <span>Marketing</span>
            </NavLink> */}

            <NavLink
              to="/admin/vouchers"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-purchase-tag-alt"></i> <span>Voucher</span>
            </NavLink>

            <NavLink
              to="/admin/banners"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-image"></i> <span>Banner</span>
            </NavLink>

            <span className="admin-nav__separator mt-3">Tài khoản</span>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-user-pin"></i> <span>User</span>
            </NavLink>

            {/* <button
              type="button"
              className="admin-nav__item w-100 border-0 bg-transparent text-start"
            >
              <i className="bx bx-group"></i> <span>Người dùng</span>
            </button> */}

            <span className="admin-nav__separator mt-3">Hệ thống</span>

            {/* <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-chip"></i> <span>Hệ thống</span>
            </NavLink> */}

            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "active" : ""}`
              }
            >
              <i className="bx bx-cog"></i> <span>Cài đặt</span>
            </NavLink>
          </div>

          <div className="admin-sidebar__footer">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-nav__item text-decoration-none"
            >
              <i className="bx bx-store-alt"></i> <span>Xem shop</span>
            </a>
            <button
              className="admin-nav__item text-danger border-0 bg-transparent w-100"
              onClick={handleLogout}
            >
              <i className="bx bx-power-off"></i> <span>Power</span>
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-header">
            <div className="admin-header__left">
              <button className="admin-sidebar-toggle" id="sidebarToggle">
                <i className="bx bx-menu"></i>
              </button>
              <div className="admin-breadcrumb">
                <Link to="/admin">Admin</Link>
                <span className="breadcrumb__separator">
                  <i className="bx bx-chevron-right"></i>
                </span>
                <span className="text-primary">Dashboard</span>
              </div>
            </div>

            <div className="admin-header__right">
              <div className="header__action-btn" title="Thông báo">
                <i className="bx bx-bell"></i>
                <span className="badge-count">2</span>
              </div>
              <div className="admin-user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="header__user-btn border-0 bg-transparent text-white d-flex align-items-center gap-2"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                >
                  <div
                    className="header__user-avatar d-flex align-items-center justify-content-center bg-secondary rounded-circle"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <i className="bx bx-user"></i>
                  </div>
                  <span className="header__user-name">
                    {user?.fullName || user?.email || "Quản trị viên"}
                  </span>
                  <i className="bx bx-chevron-down"></i>
                </button>

                {isUserMenuOpen ? (
                  <div className="admin-user-menu__dropdown" role="menu">
                    <Link
                      to="/admin"
                      className="admin-user-menu__item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="bx bxs-dashboard"></i>
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="admin-user-menu__item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="bx bx-user-circle"></i>
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <a
                      href="/"
                      className="admin-user-menu__item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="bx bx-store-alt"></i>
                      <span>Xem shop</span>
                    </a>
                    <button
                      type="button"
                      className="admin-user-menu__item admin-user-menu__item--danger"
                      onClick={handleLogout}
                    >
                      <i className="bx bx-power-off"></i>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
