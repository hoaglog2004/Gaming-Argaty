import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogIn,
  FiMail,
  FiLoader,
} from "react-icons/fi";
import { FaFacebookF, FaGoogle } from "react-icons/fa";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast("error", "Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast("error", "Lỗi", "Định dạng email không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login({
        email: email.trim(),
        password,
        rememberMe,
      });
      showToast("success", "Thành công", "Đăng nhập thành công");

      const redirectTo = location.state?.redirectTo;
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (loggedInUser?.canAccessAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Đăng nhập thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startSocialLogin = (provider) => {
    window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">
          Chào mừng bạn trở lại! Đăng nhập để tiếp tục.
        </p>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <div className="input-icon">
            <FiMail className="input-icon__symbol" size={16} />
            <input
              type="email"
              className="form-control"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mật khẩu</label>
          <div className="input-icon has-toggle">
            <FiLock className="input-icon__symbol" size={16} />
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEye size={16} /> : <FiEyeOff size={16} />}
            </button>
          </div>
        </div>

        <div className="auth-remember">
          <label className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="form-check-label">Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/auth/forgot-password" className="auth-forgot">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={submitting}
        >
          {submitting ? (
            <><FiLoader className="bx-spin" size={16} style={{ marginRight: "8px" }} /> Đang xử lý...</>
          ) : (
            <><FiLogIn size={16} style={{ marginRight: "8px" }} /> Đăng nhập</>
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>Hoặc</span>
      </div>

      <div className="auth-social">
        <button
          type="button"
          className="auth-social__btn auth-social__btn--google"
          aria-label="Đăng nhập với Google"
          onClick={() => startSocialLogin("google")}
        >
          <FaGoogle className="social-icon" size={20} />
        </button>
        <button
          type="button"
          className="auth-social__btn auth-social__btn--facebook"
          aria-label="Đăng nhập với Facebook"
          onClick={() => startSocialLogin("facebook")}
        >
          <FaFacebookF className="social-icon" size={20} />
        </button>
      </div>

      <div className="auth-footer mt-4">
        <p>
          Chưa có tài khoản? <Link to="/auth/register">Đăng ký ngay</Link>
        </p>
      </div>
    </>
  );
};

export default Login;
