import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast("error", "Lỗi", "Vui lòng hoàn thành mọi thông tin");
      return;
    }
    if (!agreeTerms) {
      showToast("error", "Lỗi", "Bạn cần đồng ý điều khoản sử dụng");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: name.trim(),
        email: email.trim(),
        password,
        confirmPassword: password,
        phone: phone.trim() || null,
        agreeTerms,
      });
      showToast(
        "success",
        "Thành công",
        "Đăng ký thành công! Vui lòng đăng nhập.",
      );
      navigate("/auth/login");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || error?.message || "Đăng ký thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Đăng ký mới</h1>
        <p className="auth-subtitle">Tạo tài khoản để trải nghiệm dịch vụ</p>
      </div>

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label className="form-label">Họ và Tên</label>
          <div className="input-icon">
            <FiUser className="input-icon__symbol" size={16} />
            <input
              type="text"
              className="form-control"
              placeholder="Nhập họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

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
          <label className="form-label">Số điện thoại</label>
          <div className="input-icon">
            <FiPhone className="input-icon__symbol" size={16} />
            <input
              type="tel"
              className="form-control"
              placeholder="Nhập số điện thoại (không bắt buộc)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

        <label className="form-check auth-terms-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <span className="form-check-label">
            Tôi đồng ý với điều khoản sử dụng
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block mt-4"
          disabled={submitting}
        >
          <FiUserPlus size={16} style={{ marginRight: "8px" }} /> Tạo tài khoản
        </button>
      </form>

      <div className="auth-footer mt-4 text-center">
        <p>
          Đã có tài khoản? <Link to="/auth/login">Đăng nhập</Link>
        </p>
      </div>
    </>
  );
};

export default Register;
