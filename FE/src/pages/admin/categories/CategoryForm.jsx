import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const ICON_PRESETS = [
  { key: "category", className: "bx bx-category", label: "Tổng quát" },
  { key: "mouse", className: "bx bx-mouse", label: "Chuột" },
  { key: "keyboard", className: "bx bx-keyboard", label: "Bàn phím" },
  { key: "headphone", className: "bx bx-headphone", label: "Tai nghe" },
  { key: "chip", className: "bx bx-chip", label: "Linh kiện" },
  { key: "desktop", className: "bx bx-desktop", label: "PC" },
  { key: "laptop", className: "bx bx-laptop", label: "Laptop" },
  { key: "mobile", className: "bx bx-mobile-alt", label: "Thiết bị di động" },
  { key: "game", className: "bx bx-joystick", label: "Gaming" },
  { key: "camera", className: "bx bx-camera", label: "Camera" },
  { key: "speaker", className: "bx bx-speaker", label: "Loa" },
  { key: "gift", className: "bx bx-gift", label: "Phụ kiện" },
];

const normalizeIconClass = (value) => {
  const icon = (value || "").trim();
  return icon || "bx bx-category";
};

const CategoryForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [parentCategories, setParentCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "bx bx-category",
    parentId: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const metadata = await adminApi.categories.metadata();
        setParentCategories(metadata?.parentCategories || []);
      } catch {
        setParentCategories([]);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const loadDetail = async () => {
      if (!isEdit) return;
      try {
        const detail = await adminApi.categories.detail(id);
        setFormData({
          name: detail.name || "",
          slug: detail.slug || "",
          icon: detail.icon || "bx bx-category",
          parentId: detail.parentId || "",
          description: detail.description || "",
          image: detail.image || "",
        });
      } catch {
        showToast("error", "Lỗi", "Không tải được dữ liệu danh mục");
      }
    };

    loadDetail();
  }, [id, isEdit, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        parentId: formData.parentId || null,
      };
      if (isEdit) {
        await adminApi.categories.update(id, payload);
      } else {
        await adminApi.categories.create(payload);
      }
      showToast(
        "success",
        "Thành công",
        isEdit ? "Đã cập nhật danh mục!" : "Đã tạo danh mục!",
      );
      navigate("/admin/categories");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể lưu danh mục",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          {isEdit ? "Sửa danh mục" : "Thêm danh mục mới"}
        </h1>
        <Link to="/admin/categories" className="btn btn-ghost">
          <i className="bx bx-arrow-back"></i> Quay lại
        </Link>
      </div>

      <div className="admin-form-card" style={{ maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Tên danh mục <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slug</label>
            <input
              type="text"
              className="form-control"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="Tự động tạo nếu bỏ trống"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Danh mục cha</label>
            <select
              className="form-control form-select"
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
            >
              <option value="">-- Không có (danh mục gốc) --</option>
              {parentCategories
                .filter((c) => String(c.id) !== String(id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Icon (Boxicons class)</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "88px 1fr",
                gap: "12px",
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "34px",
                  minHeight: "58px",
                  color: "var(--primary)",
                }}
                title={normalizeIconClass(formData.icon)}
              >
                <i className={normalizeIconClass(formData.icon)}></i>
              </div>
              <input
                type="text"
                className="form-control"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="VD: bx bx-mouse"
              />
            </div>
            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "8px",
              }}
            >
              {ICON_PRESETS.map((icon) => {
                const selected =
                  normalizeIconClass(formData.icon) === icon.className;
                return (
                  <button
                    key={icon.key}
                    type="button"
                    className={`btn btn-sm ${selected ? "btn-primary" : "btn-outline"}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "0.78rem",
                      padding: "8px 6px",
                    }}
                    onClick={() =>
                      setFormData({ ...formData, icon: icon.className })
                    }
                    title={icon.className}
                  >
                    <i
                      className={icon.className}
                      style={{ fontSize: "18px" }}
                    ></i>
                    <span>{icon.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <i className="bx bx-save"></i>
            <span>
              {saving ? " Đang lưu..." : isEdit ? " Cập nhật" : " Tạo danh mục"}
            </span>
          </button>
        </form>
      </div>
    </>
  );
};

export default CategoryForm;
