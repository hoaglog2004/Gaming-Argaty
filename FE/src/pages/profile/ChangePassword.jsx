import { useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { profileApi } from "../../services/apiServices";

const ChangePassword = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      showToast("error", "Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (formData.newPassword.length < 6) {
      showToast("error", "Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setSaving(true);
      await profileApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      showToast("success", "Thành công", "Đổi mật khẩu thành công!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể đổi mật khẩu",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Đổi mật khẩu</h2>
      </div>

      <div className="card p-4" style={{ maxWidth: "520px" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Mật khẩu hiện tại <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd.current ? "text" : "password"}
                className="form-control"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                onClick={() =>
                  setShowPwd({ ...showPwd, current: !showPwd.current })
                }
              >
                <i
                  className={`bx ${showPwd.current ? "bx-show" : "bx-hide"} text-xl`}
                ></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mật khẩu mới <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd.new ? "text" : "password"}
                className="form-control"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
              >
                <i
                  className={`bx ${showPwd.new ? "bx-show" : "bx-hide"} text-xl`}
                ></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Xác nhận mật khẩu mới <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd.confirm ? "text" : "password"}
                className="form-control"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                onClick={() =>
                  setShowPwd({ ...showPwd, confirm: !showPwd.confirm })
                }
              >
                <i
                  className={`bx ${showPwd.confirm ? "bx-show" : "bx-hide"} text-xl`}
                ></i>
              </button>
            </div>
          </div>

          <div
            className="alert alert-info mb-4"
            style={{ display: "flex", gap: "10px" }}
          >
            <i className="bx bx-info-circle" style={{ fontSize: "18px" }}></i>
            <div>
              <strong>Gợi ý mật khẩu mạnh:</strong>
              <ul style={{ margin: "8px 0 0 20px", fontSize: "13px" }}>
                <li>Ít nhất 6 ký tự</li>
                <li>Kết hợp chữ hoa, chữ thường, số</li>
              </ul>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <i className="bx bx-lock"></i>{" "}
            {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </>
  );
};

export default ChangePassword;
