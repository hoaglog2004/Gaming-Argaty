import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { orderApi } from "../../services/apiServices";

const OrderDetail = () => {
  const { orderCode } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await orderApi.myOrderDetail(orderCode);
        setOrder(data);
      } catch {
        setOrder(null);
      }
    };
    load();
  }, [orderCode]);

  const handleCancel = async () => {
    const reason = window.prompt("Nhập lý do hủy đơn hàng:");
    if (!reason) return;
    try {
      const updated = await orderApi.cancelOrder(orderCode, reason);
      setOrder(updated);
      showToast("success", "Đã hủy", `Đơn hàng ${orderCode} đã được hủy.`);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể hủy đơn",
      );
    }
  };

  if (!order)
    return (
      <div className="text-center py-20">
        <i className="bx bx-loader-alt bx-spin text-4xl text-primary"></i>
      </div>
    );

  return (
    <>
      <div className="profile-content__header">
        <div>
          <h2 className="profile-content__title mb-1">
            Đơn hàng <span className="text-cyan">{order.orderCode}</span>
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
            Đặt ngày {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <span
          className={`status-badge status-badge--${String(order.status || "").toLowerCase()}`}
        >
          {order.statusDisplayName}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "24px",
        }}
      >
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bx bx-package text-primary"></i> Sản phẩm
              </h4>
            </div>
            <div className="card-body">
              {(order.items || []).map((item) => (
                <div
                  key={item.id}
                  className="d-flex gap-4 p-4"
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                >
                  <Link
                    to={`/products/${item.productSlug}`}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.productImage || "/images/no-image.png"}
                      alt={item.productName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="mb-1 d-block"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                      {item.variantName && `${item.variantName} | `}
                      {Number(item.unitPrice || 0).toLocaleString("vi-VN")} ₫ x{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <div
                    className="text-right text-cyan"
                    style={{ fontWeight: 700 }}
                  >
                    {Number(item.subtotal || 0).toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              ))}
            </div>
            <div className="card-footer" style={{ fontSize: "14px" }}>
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính:</span>{" "}
                <span>
                  {Number(order.subtotal || 0).toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phí ship:</span>{" "}
                <span>
                  {Number(order.shippingFee || 0).toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div
                className="flex justify-between"
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "10px",
                  marginTop: "10px",
                  fontWeight: 700,
                }}
              >
                <span>Tổng cộng:</span>{" "}
                <span className="text-cyan">
                  {Number(order.totalAmount || 0).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card p-4 mb-4">
            <h4 className="mb-3">
              <i className="bx bx-map text-primary"></i> Địa chỉ giao hàng
            </h4>
            <p className="mb-1">{order.receiverName}</p>
            <p className="text-cyan mb-2">{order.receiverPhone}</p>
            <p className="text-muted mb-0">{order.fullAddress}</p>
          </div>

          <div className="card p-4 mb-4">
            <h4 className="mb-3">
              <i className="bx bx-credit-card text-primary"></i> Thanh toán
            </h4>
            <div
              className="flex justify-between mb-2"
              style={{ fontSize: "14px" }}
            >
              <span className="text-muted">Phương thức:</span>
              <span>{order.paymentMethodDisplayName}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: "14px" }}>
              <span className="text-muted">Trạng thái:</span>
              <span className={order.isPaid ? "text-success" : "text-warning"}>
                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
          </div>

          {order.note && (
            <div className="card p-4 mb-4">
              <h4 className="mb-3">
                <i className="bx bx-note text-primary"></i> Ghi chú
              </h4>
              <p className="text-muted mb-0">"{order.note}"</p>
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            {order.canCancel && (
              <button
                onClick={handleCancel}
                className="btn btn-outline text-danger"
              >
                <i className="bx bx-x"></i> Hủy đơn hàng
              </button>
            )}
            <Link to="/contact" className="btn btn-ghost">
              <i className="bx bx-support"></i> Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
