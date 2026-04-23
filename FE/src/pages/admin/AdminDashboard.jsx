import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { adminApi } from "../../services/apiServices";
import { useToast } from "../../contexts/ToastContext";
import SkeletonLoader from "../../components/common/SkeletonLoader";
import "./AdminDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, ordersData] = await Promise.all([
          adminApi.dashboard(),
          adminApi.orders.list({ page: 0, size: 5 }),
        ]);

        setStats(dashboard);

        const orderPage = ordersData?.orders || ordersData;
        setRecentOrders(orderPage?.content || []);
      } catch {
        setStats(null);
        setRecentOrders([]);
        showToast("error", "Lỗi", "Không thể tải dữ liệu dashboard admin");
      }
    };

    load();
  }, [showToast]);

  const statCards = useMemo(() => {
    if (!stats) return null;
    const s = stats;
    return [
      {
        key: "revenue",
        value: formatCurrency(s.revenueThisMonth),
        label: "Doanh thu tháng",
        iconClass: "bx bx-dollar-circle",
        colorClass: "purple",
      },
      {
        key: "orders",
        value: s.ordersThisMonth || 0,
        label: "Đơn hàng tháng",
        iconClass: "bx bx-package",
        colorClass: "cyan",
      },
      {
        key: "products",
        value: s.totalProducts || 0,
        label: "Tổng sản phẩm",
        subLabel:
          s.outOfStockProducts > 0 ? `${s.outOfStockProducts} hết hàng` : null,
        iconClass: "bx bx-box",
        colorClass: "pink",
      },
      {
        key: "users",
        value: s.totalUsers || 0,
        label: "Khách hàng",
        iconClass: "bx bx-user",
        colorClass: "green",
      },
      {
        key: "pending",
        value: s.pendingOrders || 0,
        label: "Chờ xử lý",
        iconClass: "bx bx-time",
        colorClass: "orange",
      },
    ];
  }, [stats]);

  const statusRows = useMemo(() => {
    if (!stats) return null;
    const s = stats;
    return [
      {
        key: "pending",
        label: "Chờ xác nhận",
        value: s.pendingOrders || 0,
        textClass: "text-warning",
        iconClass: "bx bx-time",
      },
      {
        key: "processing",
        label: "Đã xác nhận",
        value: s.processingOrders || 0,
        textClass: "text-info",
        iconClass: "bx bx-check",
      },
      {
        key: "shipping",
        label: "Đang giao",
        value: s.shippingOrders || 0,
        textClass: "text-primary",
        iconClass: "bx bx-car",
      },
      {
        key: "completed",
        label: "Hoàn thành",
        value: s.completedOrders || 0,
        textClass: "text-success",
        iconClass: "bx bx-check-double",
      },
      {
        key: "cancelled",
        label: "Đã hủy",
        value: s.cancelledOrders || 0,
        textClass: "text-danger",
        iconClass: "bx bx-x",
      },
    ];
  }, [stats]);

  const chartData = useMemo(() => {
    if (!stats) return null;
    const daily = stats.dailyStats || [];
    return {
      labels: daily.map((d) => d.date),
      datasets: [
        {
          fill: true,
          label: "Doanh thu",
          data: daily.map((d) => Number(d.revenue || 0)),
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(139, 92, 246, 0.1)" },
        ticks: { color: "#64748b" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" },
      },
    },
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
      </div>

      <div className="dashboard-stats">
        {statCards ? statCards.map((card) => (
          <div key={card.key} className="dashboard-stat-card">
            <div className="dashboard-stat-card__info">
              <h3>{card.value}</h3>
              <p>{card.label}</p>
              {card.subLabel ? (
                <p className="text-warning" style={{ fontSize: "12px" }}>
                  {card.subLabel}
                </p>
              ) : null}
            </div>
            <div className={`dashboard-stat-card__icon ${card.colorClass}`}>
              <i className={card.iconClass}></i>
            </div>
          </div>
        )) : Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dashboard-stat-card">
            <div className="dashboard-stat-card__info" style={{ width: "100%" }}>
              <SkeletonLoader lines={2} />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-card__header">
            <h4 className="dashboard-chart-card__title">
              Doanh thu 7 ngày gần nhất
            </h4>
          </div>
          <div className="chart-container" style={{ height: "300px" }}>
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <SkeletonLoader type="product-detail" />
            )}
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-card__header">
            <h4 className="dashboard-chart-card__title">Trạng thái đơn hàng</h4>
          </div>

          <div className="order-status-list">
            {statusRows ? statusRows.map((status) => (
              <div
                key={status.key}
                className="dashboard-status-row"
              >
                <span className={status.textClass}>
                  <i className={status.iconClass}></i> {status.label}
                </span>
                <strong>{status.value}</strong>
              </div>
            )) : (
              <div style={{ padding: "16px" }}>
                <SkeletonLoader lines={5} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="admin-table-wrapper">
          <div
            className="d-flex justify-between align-center p-4"
            style={{ borderBottom: "1px solid var(--border-color)" }}
          >
            <h4 className="mb-0">Đơn hàng gần đây</h4>
            <Link to="/admin/orders" className="btn btn-ghost btn-sm">
              Xem tất cả
            </Link>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length ? (
                recentOrders.map((order) => (
                  <tr key={order.id || order.orderCode}>
                    <td>
                      <span className="text-cyan">{order.orderCode}</span>
                    </td>
                    <td>{order.receiverName || "-"}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span
                        className={`status-badge status-badge--${String(order.status || "pending").toLowerCase()}`}
                      >
                        {order.statusDisplayName || order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-muted p-4">
                    Chưa có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-card__header">
            <h4 className="dashboard-chart-card__title">Sản phẩm bán chạy</h4>
          </div>
          <div className="p-3">
            {!stats ? (
              <SkeletonLoader lines={4} />
            ) : (stats?.topSellingProducts || []).length ? (
              stats.topSellingProducts.map((item) => (
                <div
                  key={item.productId}
                  className="dashboard-top-product-row"
                >
                  <span>{item.productName}</span>
                  <strong>{item.soldCount}</strong>
                </div>
              ))
            ) : (
              <p className="text-muted mb-0">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
