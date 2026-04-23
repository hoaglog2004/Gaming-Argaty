import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

const VerifyOtp = () => {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { validateResetToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy email từ bước forgot-password
    const savedEmail = localStorage.getItem("resetEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      // Nếu không có email, back lại trang forgot
      navigate("/auth/forgot-password");
    }
  }, [navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập token đặt lại mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const valid = await validateResetToken(token.trim());
      if (!valid) {
        showToast("error", "Lỗi", "Token không hợp lệ hoặc đã hết hạn");
        return;
      }
      setIsLoading(false);
      showToast("success", "Thành công", "Xác thực token thành công");
      navigate(
        `/auth/reset-password?token=${encodeURIComponent(token.trim())}`,
      );
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || error?.message || "Xác thực thất bại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = (e) => {
    e.preventDefault();
    showToast(
      "info",
      "Thông báo",
      "Mã OTP mới đã được gửi lại vào email của bạn.",
    );
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Xác thực OTP</h1>
        <p className="auth-subtitle">Nhập mã OTP được gửi tới email của bạn</p>
      </div>

      <form onSubmit={handleVerifyOtp} className="auth-form">
        <div className="form-group">
          <label className="form-label">Token đặt lại mật khẩu</label>
          <div className="input-icon">
            <i className="bx bx-key"></i>
            <input
              type="text"
              name="token"
              className="form-control"
              placeholder="Nhập token từ email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoFocus
              autoComplete="off"
              style={{ fontWeight: 600 }}
            />
          </div>
          <p className="text-muted mt-2" style={{ fontSize: "13px" }}>
            Nhập token bạn nhận được qua email ({email}).
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={isLoading || !token.trim()}
        >
          {isLoading ? (
            <>
              <i className="bx bx-loader-alt bx-spin"></i> Đang xác thực...
            </>
          ) : (
            <>
              <i className="bx bx-check-shield"></i> Xác thực
            </>
          )}
        </button>
      </form>

      <div className="auth-footer mt-4">
        <p>
          <Link to="/auth/login">
            <i className="bx bx-left-arrow-alt"></i> Quay lại đăng nhập
          </Link>
        </p>
        <p className="mt-2">
          Chưa nhận được mã?{" "}
          <a href="#" onClick={handleResend}>
            Gửi lại
          </a>
        </p>
      </div>
    </>
  );
};

export default VerifyOtp;
