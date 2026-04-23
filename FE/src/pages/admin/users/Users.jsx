import { useEffect, useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const Users = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const loadUsers = async (nextPage = 0, override = null) => {
    const effective = override || { searchTerm, selectedRole };
    try {
      const data = await adminApi.users.list({
        page: nextPage,
        size: 10,
        q: effective.searchTerm.trim() || undefined,
        role: effective.selectedRole || undefined,
      });
      const page = data?.users || data;
      setUsers(page?.content || []);
      setMeta({
        page: page?.page || nextPage,
        totalPages: page?.totalPages || 0,
        totalElements: page?.totalElements || 0,
      });
    } catch {
      setUsers([]);
      setMeta({ page: 0, totalPages: 0, totalElements: 0 });
      showToast("error", "Lỗi", "Không thể tải danh sách người dùng quản trị");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(0);
    }, 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (id) => {
    try {
      await adminApi.users.toggleStatus(id);
      showToast("success", "Cập nhật", "Đã thay đổi trạng thái user");
      await loadUsers(meta.page);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý người dùng</h1>
      </div>

      <form
        className="admin-filters mb-4 d-flex gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await loadUsers(0);
        }}
      >
        <div className="admin-search" style={{ flex: "1", maxWidth: "400px" }}>
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
          <input
            type="text"
            className="form-control border-0 bg-dark text-white"
            placeholder="Tìm tên, email, SĐT..."
            style={{ paddingLeft: "40px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-control form-select border-0 bg-dark text-white"
          style={{ width: "180px" }}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="USER">Khách hàng</option>
          <option value="STAFF">Nhân viên</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit" className="btn btn-primary">
          <i className="bx bx-filter-alt"></i>
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={async () => {
            setSearchTerm("");
            setSelectedRole("");
            await loadUsers(0, { searchTerm: "", selectedRole: "" });
          }}
        >
          <i className="bx bx-refresh"></i>
        </button>
      </form>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Vai trò</th>
              <th>Đơn hàng</th>
              <th>Ngày tham gia</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            alt="Avatar"
                          />
                        ) : (
                          <span style={{ color: "#fff", fontWeight: 600 }}>
                            {(user.fullName || "U").charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-white font-bold">
                        {user.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted">{user.email}</td>
                  <td className="text-muted">{user.phone || "-"}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background:
                          user.role === "ADMIN"
                            ? "rgba(239, 68, 68, 0.15)"
                            : user.role === "STAFF"
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(34, 211, 238, 0.15)",
                        color:
                          user.role === "ADMIN"
                            ? "#ef4444"
                            : user.role === "STAFF"
                              ? "#f59e0b"
                              : "#22d3ee",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="text-cyan font-bold">
                    {user.orderCount || 0}
                  </td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${user.isEnabled ? "text-success bg-success/10 border border-success/20" : "text-danger bg-danger/10 border border-danger/20"}`}
                    >
                      {user.isEnabled ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions d-flex gap-1 flex-wrap">
                      <button
                        className={`btn btn-sm btn-ghost tooltip ${user.isEnabled ? "text-danger" : "text-success"}`}
                        onClick={() => toggleStatus(user.id)}
                        title={
                          user.isEnabled
                            ? "Khóa tài khoản"
                            : "Mở khóa tài khoản"
                        }
                      >
                        <i
                          className={`bx ${user.isEnabled ? "bx-lock" : "bx-lock-open"} text-lg`}
                        ></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted p-5">
                  Không có người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-between align-center mt-4">
        <p className="text-muted mb-0">Tổng người dùng: {meta.totalElements}</p>
        <div className="pagination pagination--modern" style={{ marginTop: 0 }}>
          <button
            className={`pagination__item pagination__item--nav ${meta.page <= 0 ? "disabled" : ""}`}
            type="button"
            disabled={meta.page <= 0}
            onClick={() => loadUsers(meta.page - 1)}
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
            onClick={() => loadUsers(meta.page + 1)}
          >
            <i className="bx bx-chevron-right"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default Users;
