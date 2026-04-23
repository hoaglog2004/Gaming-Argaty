import { useEffect, useState } from "react";
import {
  useLocation,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { orderApi } from "../services/apiServices";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderInfo, setOrderInfo] = useState(null);

  const orderCode = location.state?.orderCode || searchParams.get("orderCode");

  useEffect(() => {
    const load = async () => {
      if (!orderCode) {
        navigate("/");
        return;
      }
      try {
        const data = await orderApi.myOrderDetail(orderCode);
        setOrderInfo(data);
      } catch {
        navigate("/profile/orders");
      }
    };

    load();
  }, [orderCode, navigate]);

  if (!orderInfo) {
    return (
      <div
        className="order-success-page section"
        style={{ padding: "120px 0 80px" }}
      >
        <div className="container text-center">
          <i className="bx bx-loader-alt bx-spin text-4xl text-primary"></i>
        </div>
      </div>
    );
  }

  return (
    <div
      className="order-success-page section"
      style={{ padding: "120px 0 80px" }}
    >
      <div className="container">
        <div
          className="success-card card glass text-center"
          style={{ maxWidth: "700px", margin: "0 auto", padding: "50px" }}
        >
          <div
            className="success-icon relative mb-8"
            style={{
              width: "120px",
              height: "120px",
              margin: "0 auto",
              background: "var(--gradient-aurora)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse-glow 2s infinite",
            }}
          >
            <i
              className="bx bx-check text-white"
              style={{ fontSize: "60px" }}
            ></i>
          </div>

          <h1 className="text-gradient mb-3 text-3xl font-bold">
            Đặt hàng thành công!
          </h1>
          <p className="text-secondary mb-8 text-lg">
            Cảm ơn bạn đã đặt hàng tại Argaty. Đơn hàng của bạn đang được xử lý.
          </p>

          <div className="order-info card glass p-6 mb-6 text-left">
            <h4 className="mb-4 text-xl font-semibold">
              <i className="bx bx-receipt text-primary"></i> Thông tin đơn hàng
            </h4>
            <div className="flex justify-between mb-3 border-b border-gray-700/30 pb-2">
              <span className="text-muted">Mã đơn hàng: </span>
              <span className="text-cyan font-bold font-heading text-lg">
                {orderInfo.orderCode}
              </span>
            </div>
            <div className="flex justify-between mb-3 border-b border-gray-700/30 pb-2">
              <span className="text-muted">Ngày đặt: </span>
              <span>
                {new Date(orderInfo.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="flex justify-between mb-3 border-b border-gray-700/30 pb-2">
              <span className="text-muted">Trạng thái:</span>
              <span className="status-badge status-badge--pending">
                {orderInfo.statusDisplayName}
              </span>
            </div>
            <div className="flex justify-between mb-3 border-b border-gray-700/30 pb-2">
              <span className="text-muted">Thanh toán:</span>
              <span>{orderInfo.paymentMethodDisplayName}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted">Tổng tiền:</span>
              <span className="text-cyan font-bold font-heading text-xl">
                {Number(orderInfo.totalAmount || 0).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>

          <div className="shipping-info card glass p-6 mb-6 text-left">
            <h4 className="mb-4 text-xl font-semibold">
              <i className="bx bx-map text-primary"></i> Địa chỉ giao hàng
            </h4>
            <p className="mb-1 font-medium">{orderInfo.receiverName}</p>
            <p className="mb-1 text-cyan">{orderInfo.receiverPhone}</p>
            <p className="text-muted">{orderInfo.fullAddress}</p>
          </div>

          <div className="order-items-preview card glass p-6 mb-6 text-left">
            <h4 className="mb-4 text-xl font-semibold">
              <i className="bx bx-package text-primary"></i> Sản phẩm đã đặt
            </h4>
            {(orderInfo.items || []).map((item) => (
              <div
                key={item.id}
                className="flex gap-4 mb-4 border-b border-gray-700/30 pb-4 last:border-0 last:pb-0 last:mb-0"
              >
                <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.productImage || "/images/no-image.png"}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 font-medium">{item.productName}</p>
                  <p className="text-muted text-sm">
                    {item.variantName && `${item.variantName} | `} x
                    {item.quantity}
                  </p>
                </div>
                <div className="text-cyan font-semibold">
                  {Number(item.subtotal || 0).toLocaleString("vi-VN")} ₫
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-info mb-8 text-left flex gap-2">
            <i className="bx bx-info-circle text-xl flex-shrink-0"></i>
            <span>
              Thông tin theo dõi đơn hàng sẽ được cập nhật tại mục đơn hàng của
              bạn.
            </span>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to={`/profile/orders/${orderInfo.orderCode}`}
              className="btn btn-primary btn-lg"
            >
              <i className="bx bx-box"></i> Theo dõi đơn hàng
            </Link>
            <Link to="/products" className="btn btn-outline btn-lg">
              <i className="bx bx-shopping-bag"></i> Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
