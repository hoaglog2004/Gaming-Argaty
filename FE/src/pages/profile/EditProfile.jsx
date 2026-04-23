import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { fileApi, profileApi } from "../../services/apiServices";

const getUploadedUrl = (uploadResult) => {
  if (!uploadResult) return "";
  if (typeof uploadResult === "string") return uploadResult;
  return uploadResult.url || "";
};

const EditProfile = () => {
  const { showToast } = useToast();
  const { refreshMe } = useAuth();
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    city: "",
    district: "",
    ward: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await profileApi.me();
        setUser((prev) => ({ ...prev, ...me }));
      } catch {
        setUser((prev) => ({ ...prev }));
      }
    };
    load();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const uploadResult = await fileApi.uploadAvatar(formData);
      const uploadedUrl = getUploadedUrl(uploadResult);
      if (!uploadedUrl) {
        throw new Error("Không nhận được URL ảnh từ máy chủ");
      }
      setUser((prev) => ({ ...prev, avatar: uploadedUrl }));
      showToast("success", "Thành công", "Đã tải ảnh đại diện");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể tải ảnh đại diện",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await profileApi.updateMe({
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        city: user.city,
        district: user.district,
        ward: user.ward,
      });
      await refreshMe();
      showToast("success", "Thành công", "Hồ sơ đã được cập nhật!");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật hồ sơ",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Chỉnh sửa hồ sơ</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card p-4 mb-4">
          <h4 className="mb-3">
            <i className="bx bx-user-circle text-primary"></i> Ảnh đại diện
          </h4>
          <div className="d-flex align-center gap-4">
            <div
              className="avatar-preview"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--gradient-nebula)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "40px", color: "#fff" }}>
                  {(user.fullName || "U").charAt(0)}
                </span>
              )}
            </div>
            <div>
              <input
                type="file"
                id="avatarFile"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={uploading}
                onClick={() => document.getElementById("avatarFile").click()}
              >
                <i className="bx bx-upload"></i>{" "}
                {uploading ? "Đang tải..." : "Tải ảnh lên"}
              </button>
              <p className="text-muted mt-2" style={{ fontSize: "12px" }}>
                JPG, PNG tối đa 2MB
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <h4 className="mb-3">
            <i className="bx bx-info-circle text-primary"></i> Thông tin cơ bản
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div className="form-group">
              <label className="form-label">
                Họ và tên <span className="text-danger">*</span>
              </label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-id-card"></i>
                <input
                  type="text"
                  className="form-control"
                  value={user.fullName || ""}
                  onChange={(e) =>
                    setUser({ ...user, fullName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-envelope-open"></i>
                <input
                  type="email"
                  className="form-control"
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                  value={user.email || ""}
                  disabled
                />
              </div>
              <p
                className="text-muted"
                style={{ fontSize: "12px", marginTop: "4px" }}
              >
                Email không thể thay đổi
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-phone-call"></i>
                <input
                  type="tel"
                  className="form-control"
                  value={user.phone || ""}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tỉnh/Thành</label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-buildings"></i>
                <input
                  type="text"
                  className="form-control"
                  value={user.city || ""}
                  onChange={(e) => setUser({ ...user, city: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Quận/Huyện</label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-map"></i>
                <input
                  type="text"
                  className="form-control"
                  value={user.district || ""}
                  onChange={(e) =>
                    setUser({ ...user, district: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phường/Xã</label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-current-location"></i>
                <input
                  type="text"
                  className="form-control"
                  value={user.ward || ""}
                  onChange={(e) => setUser({ ...user, ward: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Địa chỉ</label>
              <div className="input-icon input-icon--soft">
                <i className="bx bx-map-alt"></i>
                <input
                  type="text"
                  className="form-control"
                  value={user.address || ""}
                  onChange={(e) =>
                    setUser({ ...user, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <i className="bx bx-save"></i>{" "}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </>
  );
};

export default EditProfile;
