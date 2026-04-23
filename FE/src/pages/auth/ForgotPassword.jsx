import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLoader, FiMail, FiSend } from "react-icons/fi";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast("error", "Lỗi", "Vui lòng nhập email");
      return;
    }

    setIsLoading(true);
    try {
      const message = await forgotPassword(email);
      showToast("success", "Thành công", message);
      localStorage.setItem("resetEmail", email);
      navigate("/auth/verify-otp");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Không thể gửi yêu cầu",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Quên mật khẩu</h1>
        <p className="auth-subtitle">
          Nhập email để nhận mã xác thực lấy lại mật khẩu
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email đăng ký</label>
          <div className="input-icon">
            <FiMail className="input-icon__symbol" size={16} />
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Nhập email đăng ký tài khoản"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <p className="text-muted mt-2" style={{ fontSize: "13px" }}>
            Chúng tôi sẽ gửi mã OTP đặt lại mật khẩu đến email này.
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <FiLoader size={16} className="icon-spin" style={{ marginRight: "8px" }} /> Đang gửi...
            </>
          ) : (
            <>
              <FiSend size={16} style={{ marginRight: "8px" }} /> Gửi mã xác thực
            </>
          )}
        </button>
      </form>

      <div className="auth-footer mt-4">
        <p>
          <Link to="/auth/login">
            <FiArrowLeft size={16} style={{ marginRight: "8px" }} /> Quay lại đăng nhập
          </Link>
        </p>
        <p className="mt-2">
          Chưa có tài khoản? <Link to="/auth/register">Đăng ký ngay</Link>
        </p>
      </div>
    </>
  );
};

export default ForgotPassword;
