import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

const ProfileLayout = () => {
  const { showToast } = useToast();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageLabel = useMemo(() => {
    const path = location.pathname;
    if (path === "/profile") return "Tổng quan";
    if (path.startsWith("/profile/edit")) return "Chỉnh sửa hồ sơ";
    if (path.startsWith("/profile/orders/")) return "Chi tiết đơn hàng";
    if (path.startsWith("/profile/orders")) return "Đơn hàng";
    if (path.startsWith("/profile/addresses")) return "Sổ địa chỉ";
    if (path.startsWith("/profile/reviews")) return "Đánh giá";
    if (path.startsWith("/profile/notifications")) return "Thông báo";
    if (path.startsWith("/profile/change-password")) return "Đổi mật khẩu";
    return "Tài khoản";
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      showToast(
        "warning",
        "Cần đăng nhập",
        "Vui lòng đăng nhập để truy cập trang tài khoản",
      );
      navigate("/auth/login", {
        replace: true,
        state: { redirectTo: location.pathname },
      });
    }
  }, [isAuthenticated, loading, location.pathname, navigate, showToast]);

  const handleLogout = () => {
    logout();
    showToast("info", "Thông báo", "Đã đăng xuất tài khoản!");
    navigate("/auth/login");
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="profile-page">
        <div
          className="container text-center text-muted"
          style={{ padding: "140px 0 80px" }}
        >
          Đang tải thông tin tài khoản...
        </div>
      </div>
    );
  }

  const initial = (user?.fullName || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="profile-page">
      <div className="container">
        <nav className="breadcrumb">
          <div className="breadcrumb__item">
            <Link to="/">
              <i className="bx bx-home"></i> Trang chủ
            </Link>
          </div>
          <span className="breadcrumb__separator">
            <i className="bx bx-chevron-right"></i>
          </span>
          <div className="breadcrumb__item">
            {pageLabel === "Tổng quan" ? (
              "Tài khoản"
            ) : (
              <Link to="/profile">Tài khoản</Link>
            )}
          </div>
          {pageLabel !== "Tổng quan" && (
            <>
              <span className="breadcrumb__separator">
                <i className="bx bx-chevron-right"></i>
              </span>
              <div className="breadcrumb__item">{pageLabel}</div>
            </>
          )}
        </nav>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-user">
              <div className="profile-user__avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" />
                ) : (
                  <span>{initial}</span>
                )}
                <div className="profile-user__avatar-edit">
                  <i className="bx bx-camera"></i> Đổi ảnh
                </div>
              </div>
              <h3 className="profile-user__name">
                {user?.fullName || "Người dùng"}
              </h3>
              <p className="profile-user__email">{user?.email || "-"}</p>
            </div>

            <nav className="profile-nav">
              <NavLink
                to="/profile"
                end
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-user"></i>
                <span>Tổng quan</span>
              </NavLink>

              <NavLink
                to="/profile/edit"
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-edit"></i>
                <span>Chỉnh sửa hồ sơ</span>
              </NavLink>

              <NavLink
                to="/profile/orders"
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-package"></i>
                <span>Đơn hàng</span>
              </NavLink>

              <NavLink
                to="/profile/addresses"
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-map"></i>
                <span>Địa chỉ</span>
              </NavLink>

              <NavLink
                to="/profile/reviews"
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-star"></i>
                <span>Đánh giá</span>
              </NavLink>

              <NavLink
                to="/profile/notifications"
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-bell"></i>
                <span>Thông báo</span>
              </NavLink>

              <div className="profile-nav__divider"></div>

              <NavLink
                to="/profile/change-password"
                className={({ isActive }) =>
                  `profile-nav__item ${isActive ? "active" : ""}`
                }
              >
                <i className="bx bx-lock"></i>
                <span>Đổi mật khẩu</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="profile-nav__item profile-nav__item--button"
                type="button"
              >
                <i className="bx bx-log-out"></i>
                <span>Đăng xuất</span>
              </button>
            </nav>
          </aside>

          <main className="profile-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
