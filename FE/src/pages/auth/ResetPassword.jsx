import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import FormMessage from "../../components/common/FormMessage";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { showToast } = useToast();
  const { resetPassword, validateResetToken } = useAuth();
  const navigate = useNavigate();

  // Redirect if no token
  useEffect(() => {
    const run = async () => {
      if (!token) {
        showToast("error", "Lỗi", "Liên kết không hợp lệ hoặc đã hết hạn");
        navigate("/auth/forgot-password");
        return;
      }
      try {
        const valid = await validateResetToken(token);
        if (!valid) {
          showToast("error", "Lỗi", "Token không hợp lệ hoặc đã hết hạn");
          navigate("/auth/forgot-password");
        }
      } catch {
        showToast("error", "Lỗi", "Không thể xác thực token");
        navigate("/auth/forgot-password");
      }
    };
    run();
  }, [token, navigate, showToast, validateResetToken]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("error", "Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      showToast("error", "Lỗi", "Mật khẩu phải chứa ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword: password, confirmPassword });
      setIsLoading(false);
      showToast(
        "success",
        "Thành công",
        "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
      );
      localStorage.removeItem("resetEmail");
      navigate("/auth/login");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Đặt lại mật khẩu thất bại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Đặt lại mật khẩu</h1>
        <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn</p>
      </div>

      <form onSubmit={handleResetPassword} className="auth-form">
        <div className="form-group">
          <label className="form-label">
            Mật khẩu mới <span className="text-danger">*</span>
          </label>
          <div className="input-icon has-toggle">
            <i className="bx bx-shield-quarter"></i>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={
                showPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"
              }
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}></i>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Xác nhận mật khẩu <span className="text-danger">*</span>
          </label>
          <div className="input-icon has-toggle">
            <i className="bx bx-check-shield"></i>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`form-control ${confirmPassword && confirmPassword !== password ? "is-invalid" : ""}`}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={
                showConfirmPassword
                  ? "Ẩn mật khẩu xác nhận"
                  : "Hiện mật khẩu xác nhận"
              }
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <i
                className={`bx ${showConfirmPassword ? "bx-show" : "bx-hide"}`}
              ></i>
            </button>
          </div>
          {confirmPassword && confirmPassword !== password && (
            <FormMessage type="error" className="auth-form-error">
              Mật khẩu xác nhận không khớp
            </FormMessage>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <i className="bx bx-loader-alt bx-spin"></i> Đang xử lý...
            </>
          ) : (
            <>
              <i className="bx bx-check"></i> Đặt lại mật khẩu
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
      </div>
    </>
  );
};

export default ResetPassword;
