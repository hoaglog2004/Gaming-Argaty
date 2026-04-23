import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi, fileApi } from "../../../services/apiServices";

const getUploadedUrl = (uploadResult) => {
  if (!uploadResult) return "";
  if (typeof uploadResult === "string") return uploadResult;
  return uploadResult.url || "";
};

const BrandForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        const detail = await adminApi.brands.detail(id);
        setFormData({
          name: detail.name || "",
          slug: detail.slug || "",
          logo: detail.logo || "",
          description: detail.description || "",
          isActive: Boolean(detail.isActive),
        });
      } catch {
        showToast("error", "Lỗi", "Không tải được dữ liệu thương hiệu");
      }
    };
    load();
  }, [id, isEdit, showToast]);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadResult = await fileApi.uploadAvatar(form);
      const url = getUploadedUrl(uploadResult);
      if (!url) {
        throw new Error("Không nhận được URL logo từ máy chủ");
      }
      setFormData((prev) => ({ ...prev, logo: url }));
    } catch {
      showToast("error", "Lỗi", "Không thể tải logo");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập tên thương hiệu");
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await adminApi.brands.update(id, formData);
      } else {
        await adminApi.brands.create(formData);
      }

      showToast(
        "success",
        "Thành công",
        isEdit ? "Đã cập nhật thương hiệu" : "Đã tạo thương hiệu",
      );
      navigate("/admin/brands");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể lưu thương hiệu",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          {isEdit ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
        </h1>
        <Link to="/admin/brands" className="btn btn-ghost">
          <i className="bx bx-arrow-back"></i> Quay lại
        </Link>
      </div>

      <div className="admin-form-card" style={{ maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Tên thương hiệu <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slug</label>
            <input
              type="text"
              className="form-control"
              placeholder="Tự động tạo nếu bỏ trống"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Logo</label>
            <div className="d-flex align-center gap-4">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Logo"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <i
                    className="bx bx-image"
                    style={{ fontSize: "36px", color: "var(--text-muted)" }}
                  ></i>
                )}
              </div>

              <div>
                <input
                  type="file"
                  id="logoFile"
                  name="logoFile"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => document.getElementById("logoFile")?.click()}
                >
                  <i className="bx bx-upload"></i> Tải logo
                </button>
                <p className="text-muted mt-2" style={{ fontSize: "12px" }}>
                  PNG, JPG tối đa 1MB
                </p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              rows="3"
              className="form-control"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
              <span className="form-check-label">Hiển thị</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <i className="bx bx-save"></i>
            <span>
              {saving
                ? " Đang lưu..."
                : isEdit
                  ? " Cập nhật"
                  : " Tạo thương hiệu"}
            </span>
          </button>
        </form>
      </div>
    </>
  );
};

export default BrandForm;
