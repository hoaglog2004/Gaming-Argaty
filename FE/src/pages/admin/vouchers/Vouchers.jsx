import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const formatMoney = (value) => {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN");
};

const Vouchers = () => {
  const { showToast } = useToast();
  const [vouchers, setVouchers] = useState([]);

  const loadVouchers = async () => {
    try {
      const data = await adminApi.vouchers.list({ page: 0, size: 100 });
      const page = data?.vouchers || data;
      setVouchers(page?.content || []);
    } catch {
      setVouchers([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVouchers();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa voucher này?");
    if (!confirmed) return;

    try {
      await adminApi.vouchers.delete(id);
      showToast("success", "Thành công", "Đã xóa voucher");
      await loadVouchers();
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa voucher",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Voucher</h1>
        <Link to="/admin/vouchers/create" className="btn btn-primary">
          <i className="bx bx-plus"></i> Thêm voucher
        </Link>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã voucher</th>
              <th>Tên</th>
              <th>Giảm giá</th>
              <th>Đơn tối thiểu</th>
              <th>Đã dùng</th>
              <th>Thời hạn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td>
                    <code className="text-cyan">{voucher.code}</code>
                  </td>
                  <td>{voucher.name}</td>
                  <td>
                    {voucher.discountType === "PERCENTAGE" ? (
                      <span>{voucher.discountValue}%</span>
                    ) : (
                      <span>{formatMoney(voucher.discountValue)}</span>
                    )}
                    <br />
                    {voucher.maxDiscount ? (
                      <small className="text-muted">
                        Tối đa: {formatMoney(voucher.maxDiscount)}
                      </small>
                    ) : null}
                  </td>
                  <td>{formatMoney(voucher.minOrderAmount)}</td>
                  <td>
                    <span>{voucher.usedCount || 0}</span>
                    {voucher.usageLimit ? (
                      <span> / {voucher.usageLimit}</span>
                    ) : null}
                  </td>
                  <td>
                    <span>{formatDate(voucher.startDate)}</span>
                    <br />
                    <span>{formatDate(voucher.endDate)}</span>
                  </td>
                  <td>
                    {voucher.isActive ? (
                      <span className="status-badge status-badge--completed">
                        Active
                      </span>
                    ) : (
                      <span className="status-badge status-badge--cancelled">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/admin/vouchers/${voucher.id}/edit`}
                        className="table-action-btn edit"
                        title="Sửa"
                      >
                        <i className="bx bx-edit"></i>
                      </Link>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        title="Xóa"
                        onClick={() => handleDelete(voucher.id)}
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted p-5">
                  Chưa có voucher nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Vouchers;
