import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const Categories = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const data = await adminApi.categories.list({ page: 0, size: 100 });
      const page = data?.categories || data;
      setCategories(page?.content || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
  }, []);

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa danh mục ${category.name}?`,
    );
    if (!confirmed) return;

    try {
      await adminApi.categories.delete(category.id);
      showToast("success", "Thành công", "Đã xóa danh mục");
      await loadCategories();
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa danh mục",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý danh mục</h1>
        <div className="admin-page-actions">
          <Link to="/admin/categories/create" className="btn btn-primary">
            <i className="bx bx-plus"></i> Thêm danh mục
          </Link>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>STT</th>
              <th>Danh mục</th>
              <th>Slug</th>
              <th>Danh mục cha</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat, index) => (
                <tr key={cat.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="d-flex align-center gap-3">
                      <div
                        className="category-visual"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "rgba(139, 92, 246, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt="Icon"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <i
                            className={
                              cat.icon?.includes("bx ")
                                ? cat.icon
                                : `bx ${cat.icon || "bx-category"}`
                            }
                            style={{
                              fontSize: "20px",
                              color: "var(--primary)",
                            }}
                          ></i>
                        )}
                      </div>
                      <span>{cat.name}</span>
                    </div>
                  </td>
                  <td>
                    <code>{cat.slug}</code>
                  </td>
                  <td>{cat.parentName || "-"}</td>
                  <td>
                    {cat.isActive ? (
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
                        to={`/admin/categories/${cat.id}/edit`}
                        className="table-action-btn edit"
                        title="Sửa"
                      >
                        <i className="bx bx-edit"></i>
                      </Link>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        title="Xóa"
                        onClick={() => handleDelete(cat)}
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted p-5">
                  Chưa có danh mục nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Categories;
