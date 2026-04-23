import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi, fileApi } from "../../../services/apiServices";

const BannerForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    link: "",
    position: "HOME_SLIDER",
    displayOrder: 0,
    isActive: true,
    imageUrl: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        const detail = await adminApi.banners.detail(id);
        setFormData({
          title: detail.title || "",
          subtitle: detail.subtitle || "",
          link: detail.link || "",
          position: detail.position || "HOME_SLIDER",
          displayOrder: Number(detail.displayOrder || 0),
          isActive: Boolean(detail.isActive),
          imageUrl: detail.imageUrl || "",
        });
      } catch {
        showToast("error", "Lỗi", "Không thể tải dữ liệu banner");
      }
    };
    load();
  }, [id, isEdit, showToast]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append("file", file);
      const imageUrl = await fileApi.uploadBanner(form);
      setFormData((prev) => ({ ...prev, imageUrl }));
    } catch {
      showToast("error", "Lỗi", "Không thể tải ảnh banner");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      showToast("error", "Lỗi", "Vui lòng chọn ảnh banner!");
      return;
    }

    const payload = {
      ...formData,
      displayOrder: Number(formData.displayOrder || 0),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await adminApi.banners.update(id, payload);
      } else {
        await adminApi.banners.create(payload);
      }
      showToast(
        "success",
        "Thành công",
        isEdit ? "Đã cập nhật banner!" : "Đã tạo banner!",
      );
      navigate("/admin/banners");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể lưu banner",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          {isEdit ? "Sửa banner" : "Thêm banner mới"}
        </h1>
        <Link to="/admin/banners" className="btn btn-ghost">
          <i className="bx bx-arrow-back"></i> Quay lại
        </Link>
      </div>

      <div className="admin-form-card" style={{ maxWidth: "700px" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Hình ảnh <span className="text-danger">*</span>
            </label>
            <div
              className="image-upload"
              style={{ cursor: "pointer" }}
              onClick={() => document.getElementById("bannerImage")?.click()}
            >
              <input
                type="file"
                id="bannerImage"
                name="imageFile"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />

              <div id="bannerPreviewContainer">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    id="bannerPreview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                    }}
                    alt="Preview"
                  />
                ) : (
                  <div>
                    <i className="bx bx-cloud-upload image-upload__icon"></i>
                    <p className="image-upload__text">
                      Click để tải ảnh banner
                    </p>
                    <p className="image-upload__hint">
                      Kích thước đề xuất: 1920x600px
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="form-group">
              <label className="form-label">Tiêu đề</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Tiêu đề banner (tùy chọn)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                className="form-control"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Mô tả ngắn (tùy chọn)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link</label>
            <input
              type="text"
              className="form-control"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              placeholder="URL khi click vào banner (VD: /products/sale)"
            />
          </div>

          <div className="admin-form-grid">
            <div className="form-group">
              <label className="form-label">Vị trí hiển thị</label>
              <select
                className="form-control form-select"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
              >
                <option value="HOME_SLIDER">Slider trang chủ</option>
                <option value="HOME_BANNER">Banner trang chủ</option>
                <option value="CATEGORY_BANNER">Banner danh mục</option>
                <option value="POPUP">Popup</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Thứ tự hiển thị</label>
              <input
                type="number"
                className="form-control"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                min="0"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <span className="form-check-label">Hiển thị banner</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <i className="bx bx-save"></i>
            <span>
              {saving ? " Đang lưu..." : isEdit ? " Cập nhật" : " Tạo banner"}
            </span>
          </button>
        </form>
      </div>
    </>
  );
};

export default BannerForm;
