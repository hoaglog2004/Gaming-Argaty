import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const VoucherForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscount: "",
    minOrderAmount: "0",
    usageLimit: "",
    usageLimitPerUser: "1",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        const detail = await adminApi.vouchers.detail(id);
        setFormData({
          code: detail.code || "",
          name: detail.name || "",
          description: detail.description || "",
          discountType: detail.discountType || "PERCENTAGE",
          discountValue: detail.discountValue || "",
          maxDiscount: detail.maxDiscount || "",
          minOrderAmount: detail.minOrderAmount || "0",
          usageLimit: detail.usageLimit || "",
          usageLimitPerUser: detail.usageLimitPerUser || "1",
          startDate: toDateTimeInput(detail.startDate),
          endDate: toDateTimeInput(detail.endDate),
          isActive: Boolean(detail.isActive),
        });
      } catch {
        showToast("error", "Lỗi", "Không tải được dữ liệu voucher");
      }
    };

    load();
  }, [id, isEdit, showToast]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập mã và tên voucher");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      showToast("error", "Lỗi", "Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minOrderAmount: formData.minOrderAmount
          ? Number(formData.minOrderAmount)
          : 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        usageLimitPerUser: formData.usageLimitPerUser
          ? Number(formData.usageLimitPerUser)
          : 1,
      };

      if (isEdit) {
        await adminApi.vouchers.update(id, payload);
      } else {
        await adminApi.vouchers.create(payload);
      }

      showToast(
        "success",
        "Thành công",
        isEdit ? "Đã cập nhật voucher" : "Đã tạo voucher mới",
      );
      navigate("/admin/vouchers");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể lưu voucher",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{ maxWidth: "800px", margin: "0 auto" }}
      >
        <h4 className="fw-bold mb-0 text-white">
          {isEdit ? "CẬP NHẬT VOUCHER" : "TẠO VOUCHER MỚI"}
        </h4>
        <Link to="/admin/vouchers" className="btn btn-outline-secondary btn-sm">
          <i className="bx bx-arrow-back"></i> Quay lại
        </Link>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="admin-form-card">
          <div className="section-title">
            <i className="bx bx-info-circle"></i> Thông tin chung
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">
                Mã Voucher <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control text-uppercase fw-bold text-primary"
                placeholder="VD: SALE2024"
                value={formData.code}
                onChange={(e) =>
                  handleChange("code", e.target.value.toUpperCase())
                }
                required
                disabled={isEdit}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">
                Tên chương trình <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: Siêu khuyến mãi mùa hè"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Mô tả ngắn gọn về điều kiện voucher..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="section-title">
            <i className="bx bx-purchase-tag-alt"></i> Mức giảm & Điều kiện
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Loại giảm giá</label>
              <select
                className="form-control form-select voucher-select"
                value={formData.discountType}
                onChange={(e) => handleChange("discountType", e.target.value)}
              >
                <option value="PERCENTAGE">Theo phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Giá trị giảm <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                value={formData.discountValue}
                onChange={(e) => handleChange("discountValue", e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Giảm tối đa (VNĐ)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Không giới hạn"
                value={formData.maxDiscount}
                onChange={(e) => handleChange("maxDiscount", e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Đơn tối thiểu (VNĐ)</label>
              <div className="input-group">
                <span className="input-group-text">&ge;</span>
                <input
                  type="number"
                  className="form-control"
                  value={formData.minOrderAmount}
                  onChange={(e) =>
                    handleChange("minOrderAmount", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Lượt dùng tối đa</label>
              <input
                type="number"
                className="form-control"
                placeholder="Không giới hạn"
                value={formData.usageLimit}
                onChange={(e) => handleChange("usageLimit", e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Lượt dùng/Người</label>
              <input
                type="number"
                className="form-control"
                value={formData.usageLimitPerUser}
                onChange={(e) =>
                  handleChange("usageLimitPerUser", e.target.value)
                }
              />
            </div>
          </div>

          <div className="section-title">
            <i className="bx bx-time"></i> Thời gian & Trạng thái
          </div>

          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label">
                Bắt đầu <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-control datetime-input voucher-datetime"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">
                Kết thúc <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-control datetime-input voucher-datetime"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                required
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <div
                className="form-check form-switch w-100 p-2 rounded border border-secondary"
                style={{ background: "rgba(255, 255, 255, 0.02)" }}
              >
                <input
                  className="form-check-input ms-0 me-2"
                  type="checkbox"
                  id="activeSwitch"
                  checked={formData.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                />
                <label
                  className="form-check-label text-white small"
                  htmlFor="activeSwitch"
                >
                  Kích hoạt
                </label>
              </div>
            </div>
          </div>

          <hr className="border-secondary my-4" />

          <div className="d-flex justify-content-end gap-3">
            <Link
              to="/admin/vouchers"
              className="btn btn-outline-secondary px-4"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              className="btn btn-primary px-5"
              disabled={saving}
            >
              <i className="bx bx-save"></i>{" "}
              {saving ? "Đang lưu..." : "Lưu Voucher"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .section-title {
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-title::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border-color);
        }

        .datetime-input {
          color-scheme: dark;
        }

        .voucher-select,
        .voucher-datetime {
          font-family: var(--font-primary);
          font-size: 0.95rem;
          line-height: 1.4;
          letter-spacing: 0.01em;
        }

        .voucher-select option {
          font-family: var(--font-primary);
          color: #0b1222;
        }

        .voucher-datetime {
          font-variant-numeric: tabular-nums;
          color: var(--text-color);
        }

        .voucher-datetime::-webkit-calendar-picker-indicator {
          opacity: 0.8;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default VoucherForm;
