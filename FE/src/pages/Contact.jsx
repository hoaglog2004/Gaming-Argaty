import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../contexts/ToastContext";
import apiClient from "../services/apiClient";

const Contact = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Tư vấn sản phẩm",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      showToast("error", "Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/contact/send-message", formData);
      
      if (response.data.status === "success") {
        showToast(
          "success",
          "Đã gửi",
          "Tin nhắn của bạn đã được chuyển tới CSKH ARGATY!",
        );
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "Tư vấn sản phẩm",
          message: "",
        });
      } else {
        showToast("error", "Lỗi", response.data.message || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast(
        "error",
        "Lỗi",
        error.response?.data?.message || "Không thể gửi tin nhắn. Vui lòng thử lại sau",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="contact-page"
      style={{ paddingTop: "120px", paddingBottom: "80px" }}
    >
      <div className="container">
        <nav className="breadcrumb">
          <div className="breadcrumb__item">
            <Link to="/">
              <i className="bx bx-home"></i> Trang chủ
            </Link>
          </div>
          <span className="breadcrumb__separator">
            <i className="bx bx-chevron-right"></i>
          </span>
          <div className="breadcrumb__item">Liên hệ</div>
        </nav>

        <h1 className="section-title mb-5 text-center">
          Liên Hệ Với Chúng Tôi
        </h1>

        <div
          className="contact-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(350px, 1fr) 1.5fr",
            gap: "50px",
          }}
        >
          <div className="contact-info">
            <div className="card glass p-5 mb-4 hover-scale">
              <i
                className="bx bx-map text-primary"
                style={{ fontSize: "36px", marginBottom: "15px" }}
              ></i>
              <h4 className="mb-2">Địa Chỉ Giao Dịch</h4>
              <p className="text-muted">
                Đại học FPT, Đường D1, Khu Đào tạo Đại học Quốc gia, Quận 9,
                TP.HCM
              </p>
            </div>

            <div className="card glass p-5 mb-4 hover-scale">
              <i
                className="bx bx-phone-call text-accent"
                style={{
                  fontSize: "36px",
                  marginBottom: "15px",
                  color: "var(--accent)",
                }}
              ></i>
              <h4 className="mb-2">Hotline 24/7</h4>
              <p className="text-muted">1900 1508 - (028) 38.651.170</p>
            </div>

            <div className="card glass p-5 hover-scale">
              <i
                className="bx bx-envelope text-danger"
                style={{
                  fontSize: "36px",
                  marginBottom: "15px",
                  color: "#ef4444",
                }}
              ></i>
              <h4 className="mb-2">Email Hỗ Trợ</h4>
              <p className="text-muted">support@argaty.vn</p>
            </div>
          </div>

          <div className="contact-form-wrapper card glass p-5 h-100">
            <h3 className="mb-4 text-gradient">Gửi Yêu Cầu Hỗ Trợ</h3>
            <form onSubmit={handleSend}>
              <div className="form-group">
                <label className="form-label">
                  Tên của bạn <span className="text-danger">*</span>
                </label>
                <div className="input-icon input-icon--soft">
                  <i className="bx bx-id-card"></i>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Nhập họ và tên"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <div className="input-icon input-icon--soft">
                  <i className="bx bx-envelope-open"></i>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Nhập địa chỉ email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <div className="input-icon input-icon--soft">
                  <i className="bx bx-phone"></i>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="Nhập số điện thoại (tùy chọn)"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Chủ đề hỗ trợ <span className="text-danger">*</span>
                </label>
                <select
                  name="subject"
                  className="form-control form-select"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option>Tư vấn sản phẩm</option>
                  <option>Báo lỗi đơn hàng</option>
                  <option>Chính sách bảo hành</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">
                  Nội dung <span className="text-danger">*</span>
                </label>
                <textarea
                  name="message"
                  className="form-control"
                  rows="5"
                  placeholder="Chi tiết yêu cầu của bạn..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin"></i> Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="bx bx-paper-plane"></i> Gửi Tin Nhắn
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
