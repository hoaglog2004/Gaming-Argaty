import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { profileApi, orderApi } from "../../services/apiServices";

const getStatusClass = (status) =>
  `status-badge status-badge--${String(status || "").toLowerCase()}`;

const Overview = () => {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, orderPage] = await Promise.all([
          profileApi.me(),
          orderApi.myOrders({ page: 0, size: 5 }),
        ]);
        setProfile(me);
        setOrders(orderPage?.content || []);
      } catch {
        setProfile(null);
        setOrders([]);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((x) => x.status === "PENDING").length;
    const totalSpent = orders.reduce(
      (sum, x) => sum + Number(x.totalAmount || 0),
      0,
    );
    return { totalOrders, pendingOrders, totalSpent };
  }, [orders]);

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Tổng quan tài khoản</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-card__icon"
            style={{
              background: "rgba(139, 92, 246, 0.15)",
              color: "var(--primary)",
            }}
          >
            <i className="bx bx-package"></i>
          </div>
          <div>
            <div className="stat-card__value">{stats.totalOrders}</div>
            <div className="stat-card__label">Đơn hàng</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card__icon"
            style={{
              background: "rgba(34, 211, 238, 0.15)",
              color: "var(--accent-cyan)",
            }}
          >
            <i className="bx bx-wallet"></i>
          </div>
          <div>
            <div className="stat-card__value">
              {stats.totalSpent.toLocaleString("vi-VN")} ₫
            </div>
            <div className="stat-card__label">Tổng chi tiêu</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card__icon"
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--warning)",
            }}
          >
            <i className="bx bx-time"></i>
          </div>
          <div>
            <div className="stat-card__value">{stats.pendingOrders}</div>
            <div className="stat-card__label">Đang xử lý</div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header d-flex justify-between align-center">
          <h4 className="mb-0">Đơn hàng gần đây</h4>
          <Link to="/profile/orders" className="btn btn-ghost btn-sm">
            Xem tất cả <i className="bx bx-right-arrow-alt"></i>
          </Link>
        </div>

        <div className="card-body p-0">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.orderCode}>
                    <td>
                      <span className="order-code">{order.orderCode}</span>
                    </td>
                    <td>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </td>
                    <td>
                      <span className="order-total">
                        {Number(order.totalAmount || 0).toLocaleString("vi-VN")}{" "}
                        ₫
                      </span>
                    </td>
                    <td>
                      <span className={getStatusClass(order.status)}>
                        {order.statusDisplayName}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/profile/orders/${order.orderCode}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    Chưa có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header d-flex justify-between align-center">
          <h4 className="mb-0">Thông tin tài khoản</h4>
          <Link to="/profile/edit" className="btn btn-ghost btn-sm">
            <i className="bx bx-edit"></i> Chỉnh sửa
          </Link>
        </div>

        <div className="card-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div>
              <p
                className="text-muted"
                style={{ fontSize: "13px", marginBottom: "6px" }}
              >
                Họ và tên
              </p>
              <p>{profile?.fullName || "-"}</p>
            </div>
            <div>
              <p
                className="text-muted"
                style={{ fontSize: "13px", marginBottom: "6px" }}
              >
                Email
              </p>
              <p>{profile?.email || "-"}</p>
            </div>
            <div>
              <p
                className="text-muted"
                style={{ fontSize: "13px", marginBottom: "6px" }}
              >
                Số điện thoại
              </p>
              <p className="text-cyan">{profile?.phone || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview;
