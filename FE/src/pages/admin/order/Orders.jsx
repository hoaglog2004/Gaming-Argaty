import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const statusOptions = [
  { value: "PENDING", label: "Chờ xác nhận", variant: "pending" },
  { value: "CONFIRMED", label: "Đã xác nhận", variant: "confirmed" },
  { value: "PROCESSING", label: "Đang xử lý", variant: "processing" },
  { value: "SHIPPING", label: "Đang giao", variant: "shipping" },
  { value: "DELIVERED", label: "Đã giao", variant: "delivered" },
  { value: "COMPLETED", label: "Hoàn thành", variant: "completed" },
  { value: "CANCELLED", label: "Đã hủy", variant: "cancelled" },
];

const statusMap = statusOptions.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase();

const getStatusMeta = (status, displayName) => {
  const normalized = normalizeStatus(status);
  const meta = statusMap[normalized];
  if (meta) {
    return {
      label: displayName || meta.label,
      variant: meta.variant,
    };
  }

  return {
    label: displayName || status || "Không xác định",
    variant: "pending",
  };
};

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const Orders = () => {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [activeOrder, setActiveOrder] = useState(null);
  const [statusDraft, setStatusDraft] = useState("PENDING");

  const loadOrders = async (nextPage = 0, overrideFilters = null) => {
    const appliedFilters = overrideFilters || filters;
    const keyword = (appliedFilters.q || "").trim();
    const selectedStatus = appliedFilters.status || "";

    try {
      const data = await adminApi.orders.list({
        page: nextPage,
        size: 12,
        q: selectedStatus ? undefined : keyword || undefined,
        status: selectedStatus || undefined,
      });
      const page = data?.orders || data;
      const rows = page?.content || [];
      setOrders(rows);
      setMeta({
        page: page?.page || nextPage,
        totalPages: page?.totalPages || 0,
        totalElements: page?.totalElements || 0,
      });
      if (!rows.length) {
        setActiveOrder(null);
        return;
      }

      const selectedOrderStillVisible =
        activeOrder && rows.some((row) => row.id === activeOrder.id);
      if (!selectedOrderStillVisible) {
        await loadDetail(rows[0].id);
      }
    } catch {
      setOrders([]);
      setMeta({ page: 0, totalPages: 0, totalElements: 0 });
      showToast("error", "Lỗi", "Không thể tải danh sách đơn hàng quản trị");
    }
  };

  const loadDetail = async (id) => {
    try {
      const detail = await adminApi.orders.detail(id);
      setActiveOrder(detail);
      setStatusDraft(detail?.status || "PENDING");
    } catch {
      setActiveOrder(null);
      showToast("error", "Lỗi", "Không thể tải chi tiết đơn hàng");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const productsTotal = useMemo(
    () =>
      (activeOrder?.items || []).reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0,
      ),
    [activeOrder],
  );

  const handleUpdateStatus = async () => {
    if (!activeOrder?.id) return;
    try {
      await adminApi.orders.updateStatus(activeOrder.id, {
        status: statusDraft,
        note: "",
      });
      showToast("success", "Thành công", "Đã cập nhật trạng thái đơn hàng");
      await loadDetail(activeOrder.id);
      await loadOrders(meta.page);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeOrder?.id) return;
    try {
      await adminApi.orders.markPaid(activeOrder.id);
      showToast("success", "Thành công", "Đã xác nhận thanh toán");
      await loadDetail(activeOrder.id);
      await loadOrders(meta.page);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xác nhận thanh toán",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">MISSION CONTROL: ORDER TRACKING</h1>
      </div>

      <form
        className="admin-filters mb-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await loadOrders(0);
        }}
      >
        <div className="admin-search">
          <i className="bx bx-search"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Tìm mã đơn, tên khách, SĐT..."
            value={filters.q}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, q: event.target.value }))
            }
          />
        </div>

        <select
          className="form-control form-select admin-filter-select"
          value={filters.status}
          onChange={async (event) => {
            const nextStatus = event.target.value;
            const nextFilters = { q: "", status: nextStatus };
            setFilters(nextFilters);
            await loadOrders(0, nextFilters);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary">
          <i className="bx bx-filter-alt"></i> Lọc
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={async () => {
            const nextFilters = { q: "", status: "" };
            setFilters(nextFilters);
            await loadOrders(0, nextFilters);
          }}
        >
          <i className="bx bx-refresh"></i>
        </button>
      </form>

      <div className="order-detail-grid">
        <div>
          <div className="admin-table-wrapper mb-3">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? (
                  orders.map((order) => {
                    const statusMeta = getStatusMeta(
                      order.status,
                      order.statusDisplayName,
                    );
                    return (
                      <tr
                        key={order.id}
                        style={{
                          cursor: "pointer",
                          background:
                            activeOrder?.id === order.id
                              ? "rgba(139, 92, 246, 0.08)"
                              : "transparent",
                        }}
                        onClick={() => loadDetail(order.id)}
                      >
                        <td>
                          <strong>{order.orderCode}</strong>
                        </td>
                        <td>
                          <div>{order.receiverName}</div>
                          <small className="text-muted">
                            {order.receiverPhone || "-"}
                          </small>
                        </td>
                        <td className="text-cyan">
                          {formatMoney(order.totalAmount)}
                        </td>
                        <td>
                          <span
                            className={`status-badge status-badge--${statusMeta.variant}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("vi-VN")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted p-4">
                      Không có đơn hàng phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination pagination--modern mt-3">
            <button
              className={`pagination__item pagination__item--nav ${meta.page <= 0 ? "disabled" : ""}`}
              type="button"
              disabled={meta.page <= 0}
              onClick={() => loadOrders(meta.page - 1)}
            >
              <i className="bx bx-chevron-left"></i>
            </button>
            <button className="pagination__item active" type="button">
              {meta.page + 1}
            </button>
            <button
              className={`pagination__item pagination__item--nav ${meta.page + 1 >= meta.totalPages ? "disabled" : ""}`}
              type="button"
              disabled={meta.page + 1 >= meta.totalPages}
              onClick={() => loadOrders(meta.page + 1)}
            >
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>
          <p className="text-muted mt-2">Tổng: {meta.totalElements} đơn hàng</p>
        </div>

        {activeOrder ? (
          <div>
            <div className="order-info-card mb-4">
              <h4 className="order-info-card__title">Cập nhật trạng thái</h4>
              <div className="d-flex gap-2 align-end">
                <div style={{ minWidth: "260px" }}>
                  <label className="form-label">Chọn trạng thái mới</label>
                  <select
                    className="form-control form-select"
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value)}
                  >
                    {statusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleUpdateStatus}
                >
                  CẬP NHẬT
                </button>
              </div>
            </div>

            <div className="order-info-card mb-4">
              <h4 className="order-info-card__title">Sản phẩm đặt hàng</h4>
              <div className="tracking-items">
                {(activeOrder.items || []).map((item) => (
                  <div key={item.id} className="tracking-item-row">
                    <img
                      src={item.productImage || "/images/no-image.png"}
                      alt={item.productName}
                    />
                    <div className="tracking-item-row__info">
                      <h6>{item.productName}</h6>
                      <p>{formatMoney(item.unitPrice)} / sản phẩm</p>
                    </div>
                    <div className="tracking-item-row__qty">
                      x{item.quantity}
                    </div>
                    <div className="tracking-item-row__sum">
                      {formatMoney(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="tracking-total">
                <span>Tổng tiền sản phẩm</span>
                <strong>{formatMoney(productsTotal)}</strong>
              </div>
            </div>

            <div className="order-info-card mb-4">
              <h4 className="order-info-card__title">Thông tin giao hàng</h4>
              <div className="order-info-row">
                <span className="order-info-row__label">Họ tên</span>
                <strong className="order-info-row__value">
                  {activeOrder.receiverName}
                </strong>
              </div>
              <div className="order-info-row">
                <span className="order-info-row__label">SĐT</span>
                <strong className="order-info-row__value">
                  {activeOrder.receiverPhone}
                </strong>
              </div>
              <div className="order-info-row">
                <span className="order-info-row__label">Email</span>
                <strong className="order-info-row__value">
                  {activeOrder.receiverEmail}
                </strong>
              </div>
              <div className="order-info-row">
                <span className="order-info-row__label">Địa chỉ</span>
                <strong className="order-info-row__value">
                  {activeOrder.fullAddress}
                </strong>
              </div>
            </div>

            <div className="order-info-card">
              <h4 className="order-info-card__title">Thanh toán</h4>
              <div className="order-info-row">
                <span className="order-info-row__label">Phương thức</span>
                <strong className="order-info-row__value">
                  {activeOrder.paymentMethodDisplayName}
                </strong>
              </div>
              <div className="order-info-row">
                <span className="order-info-row__label">Trạng thái</span>
                <strong
                  className={`order-info-row__value ${activeOrder.isPaid ? "text-success" : "text-warning"}`}
                >
                  {activeOrder.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                </strong>
              </div>
              {!activeOrder.isPaid && (
                <button
                  className="btn btn-primary w-100 mt-3"
                  type="button"
                  onClick={handleConfirmPayment}
                >
                  <i className="bx bx-check-circle"></i> XÁC NHẬN THANH TOÁN
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="order-info-card">
            <p className="text-muted mb-0">
              Chọn một đơn hàng để xem chi tiết.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;
