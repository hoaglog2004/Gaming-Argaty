import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { orderApi } from "../../services/apiServices";

const getStatusClass = (status) =>
  `status-badge status-badge--${String(status || "").toLowerCase()}`;

const Orders = () => {
  const [currentStatus, setCurrentStatus] = useState("ALL");
  const [orders, setOrders] = useState([]);
  const { showToast } = useToast();

  const fetchOrders = async (status) => {
    const params = { page: 0, size: 20 };
    if (status !== "ALL") params.status = status;
    const result = await orderApi.myOrders(params);
    return result?.content || [];
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const list = await fetchOrders(currentStatus);
        if (isMounted) setOrders(list);
      } catch {
        if (isMounted) setOrders([]);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [currentStatus]);

  const handleCancel = async (orderCode) => {
    const reason = window.prompt("Nhập lý do hủy đơn hàng:");
    if (!reason) return;
    try {
      await orderApi.cancelOrder(orderCode, reason);
      showToast("success", "Thành công", "Đã hủy đơn hàng");
      const list = await fetchOrders(currentStatus);
      setOrders(list);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể hủy đơn",
      );
    }
  };

  const tabs = [
    { id: "ALL", label: "Tất cả" },
    { id: "PENDING", label: "Chờ xác nhận" },
    { id: "CONFIRMED", label: "Đã xác nhận" },
    { id: "SHIPPING", label: "Đang giao" },
    { id: "COMPLETED", label: "Hoàn thành" },
    { id: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Đơn hàng của tôi</h2>
      </div>

      <div className="tabs mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setCurrentStatus(tab.id);
            }}
            className={`tab ${currentStatus === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.orderCode} className="order-card card mb-4">
              <div className="card-header d-flex justify-between align-center flex-wrap gap-3">
                <div>
                  <span className="text-muted" style={{ fontSize: "13px" }}>
                    Mã đơn hàng:{" "}
                  </span>
                  <span className="order-code">{order.orderCode}</span>
                  <span className="text-muted mx-2">|</span>
                  <span className="text-muted" style={{ fontSize: "13px" }}>
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <span className={getStatusClass(order.status)}>
                  {order.statusDisplayName}
                </span>
              </div>

              <div className="card-body">
                <div className="order-preview d-flex align-center gap-4">
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--bg-void)",
                    }}
                  >
                    <img
                      src={order.firstProductImage || "/images/no-image.png"}
                      alt={order.firstProductName || order.orderCode}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="mb-1">
                      {order.firstProductName || "Đơn hàng"}
                    </p>
                    <p className="text-muted" style={{ fontSize: "13px" }}>
                      {(order.totalItems || 0) > 1
                        ? `và ${Math.max((order.totalItems || 0) - 1, 0)} sản phẩm khác`
                        : "x1"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted mb-1" style={{ fontSize: "13px" }}>
                      Tổng tiền:
                    </p>
                    <p
                      className="text-cyan mb-0"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize: "18px",
                      }}
                    >
                      {Number(order.totalAmount || 0).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-footer d-flex justify-between align-center flex-wrap gap-3">
                <div>
                  <span className="text-muted" style={{ fontSize: "13px" }}>
                    <i className="bx bx-credit-card"></i>{" "}
                    {order.paymentMethodDisplayName}{" "}
                    {order.isPaid ? (
                      <span className="text-success">• Đã thanh toán</span>
                    ) : (
                      <span className="text-warning">• Chưa thanh toán</span>
                    )}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    to={`/profile/orders/${order.orderCode}`}
                    className="btn btn-outline btn-sm"
                  >
                    Xem chi tiết
                  </Link>
                  {order.status === "PENDING" && (
                    <button
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => handleCancel(order.orderCode)}
                    >
                      <i className="bx bx-x"></i> Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="bx bx-package"></i>
            </div>
            <h3 className="empty-state__title">Không có đơn hàng</h3>
            <p className="empty-state__desc">
              Bạn chưa có đơn hàng nào trong danh mục này.
            </p>
            <Link to="/products" className="btn btn-primary">
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;
