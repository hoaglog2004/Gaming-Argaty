import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const Brands = () => {
  const { showToast } = useToast();
  const [brands, setBrands] = useState([]);

  const loadBrands = async () => {
    try {
      const data = await adminApi.brands.list({ page: 0, size: 100 });
      const page = data?.brands || data;
      setBrands(page?.content || []);
    } catch {
      setBrands([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBrands();
  }, []);

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa thương hiệu ${brand.name}?`,
    );
    if (!confirmed) return;

    try {
      await adminApi.brands.delete(brand.id);
      showToast("success", "Thành công", "Đã xóa thương hiệu");
      await loadBrands();
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa thương hiệu",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý thương hiệu</h1>
        <Link to="/admin/brands/create" className="btn btn-primary">
          <i className="bx bx-plus"></i> Thêm thương hiệu
        </Link>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>STT</th>
              <th>Thương hiệu</th>
              <th>Slug</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {brands.length > 0 ? (
              brands.map((brand, index) => (
                <tr key={brand.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="d-flex align-center gap-3">
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          background: "var(--bg-void)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <i
                            className="bx bx-image"
                            style={{
                              fontSize: "24px",
                              color: "var(--text-muted)",
                            }}
                          ></i>
                        )}
                      </div>
                      <span>{brand.name}</span>
                    </div>
                  </td>
                  <td>
                    <code>{brand.slug}</code>
                  </td>
                  <td>
                    {brand.isActive ? (
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
                        to={`/admin/brands/${brand.id}/edit`}
                        className="table-action-btn edit"
                        title="Sửa"
                      >
                        <i className="bx bx-edit"></i>
                      </Link>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        title="Xóa"
                        onClick={() => handleDelete(brand)}
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted p-5">
                  Chưa có thương hiệu nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Brands;
