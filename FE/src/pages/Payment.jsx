import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { paymentApi } from "../services/apiServices";

const Payment = () => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState({
    type: "info",
    message: "Đang tạo phiên thanh toán...",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const orderCode = location.state?.orderCode || searchParams.get("orderCode");
  const paymentMethod =
    location.state?.paymentMethod || searchParams.get("paymentMethod");
  const totalAmount = Number(
    location.state?.totalAmount || searchParams.get("totalAmount") || 0,
  );

  useEffect(() => {
    const setup = async () => {
      if (!orderCode) {
        setNotice({
          type: "danger",
          message: "Không tìm thấy mã đơn hàng để khởi tạo thanh toán.",
        });
        setIsLoading(false);
        return;
      }

      if (paymentMethod === "COD") {
        setNotice({
          type: "info",
          message: "Đơn hàng COD sẽ thanh toán khi nhận hàng.",
        });
        navigate(`/profile/orders/${orderCode}`);
        return;
      }

      try {
        const createdSession = await paymentApi.createSession(orderCode);
        setSession(createdSession);
        setNotice({
          type: "success",
          message: createdSession?.message || "Phiên thanh toán đã sẵn sàng",
        });
      } catch (error) {
        setNotice({
          type: "danger",
          message:
            error?.response?.data?.message || "Không thể tạo phiên thanh toán",
        });
      } finally {
        setIsLoading(false);
      }
    };

    setup();
  }, [orderCode, paymentMethod, navigate]);

  const confirmBankTransfer = async () => {
    try {
      await paymentApi.confirmBank(orderCode);
      showToast("success", "Thành công", "Xác nhận thanh toán thành công");
      navigate(`/profile/orders/${orderCode}`);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xác nhận chuyển khoản",
      );
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const paid = await paymentApi.status(orderCode);
      if (paid) {
        showToast(
          "success",
          "Đã thanh toán",
          "Đơn hàng đã được ghi nhận thanh toán",
        );
        navigate(`/profile/orders/${orderCode}`);
        return;
      }
      showToast("info", "Kiểm tra", "Hệ thống đang chờ ghi nhận thanh toán...");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          "Không thể kiểm tra trạng thái thanh toán",
      );
    }
  };

  const qrImageUrl =
    session?.qrImageUrl ||
    (session?.paymentUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(session.paymentUrl)}`
      : null);

  return (
    <div className="payment-page section" style={{ padding: "120px 0 80px" }}>
      <div className="container" style={{ maxWidth: "600px" }}>
        <div className="text-center mb-5">
          <h1 className="section-title text-gradient">Thanh toán</h1>
          <p className="section-subtitle">
            Xác nhận đơn hàng và tiến hành thanh toán
          </p>
        </div>

        <div className="card glass p-5">
          {orderCode && (
            <div className="mb-4">
              <p className="text-secondary mb-3">
                Mã đơn hàng:{" "}
                <strong className="text-primary">{orderCode}</strong>
              </p>
              {totalAmount > 0 && (
                <p className="text-secondary mb-4">
                  Tổng tiền:{" "}
                  <strong className="text-cyan">
                    {totalAmount.toLocaleString("vi-VN")} ₫
                  </strong>
                </p>
              )}
              <p className="text-secondary mb-4">
                Phương thức:{" "}
                <strong className="text-primary">
                  {paymentMethod || session?.paymentMethod}
                </strong>
              </p>
            </div>
          )}

          <div
            className={`alert alert-${notice.type} mb-4 flex items-center gap-2`}
          >
            {isLoading && <i className="bx bx-loader-alt bx-spin"></i>}
            {!isLoading && <i className="bx bx-info-circle"></i>}
            <span>{notice.message}</span>
          </div>

          {!isLoading && session && (
            <div className="mt-4">
              {qrImageUrl && (
                <div className="text-center mb-4">
                  <img
                    src={qrImageUrl}
                    alt="QR thanh toán"
                    style={{
                      maxWidth: "280px",
                      borderRadius: "12px",
                      margin: "0 auto",
                    }}
                  />
                  <p className="mt-3 mb-1 text-muted">
                    Mã tham chiếu: <strong>{session.transactionRef}</strong>
                  </p>
                  <p className="mb-3 text-muted">
                    Hết hạn:{" "}
                    <strong>
                      {new Date(session.expiresAt).toLocaleString("vi-VN")}
                    </strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={confirmBankTransfer}
                  >
                    Tôi đã chuyển khoản
                  </button>
                </div>
              )}

              {session.paymentUrl && (
                <div className="text-center mb-4">
                  <a
                    href={session.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-lg"
                  >
                    <i className="bx bx-link-external"></i> Mở cổng thanh toán
                  </a>
                  <p className="mt-3 text-muted">
                    Mã tham chiếu: <strong>{session.transactionRef}</strong>
                  </p>
                </div>
              )}

              <div className="text-center mt-5">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={checkPaymentStatus}
                >
                  Kiểm tra trạng thái thanh toán
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4">
            {orderCode && (
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/profile/orders/${orderCode}`)}
              >
                <i className="bx bx-box"></i> Xem đơn hàng
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              <i className="bx bx-left-arrow-alt"></i> Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
