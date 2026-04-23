import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const Banners = () => {
  const { showToast } = useToast();
  const [banners, setBanners] = useState([]);

  const loadBanners = async () => {
    try {
      const data = await adminApi.banners.list({ page: 0, size: 100 });
      const page = data?.banners || data;
      setBanners(page?.content || []);
    } catch {
      setBanners([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBanners();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa banner này?")) return;
    try {
      await adminApi.banners.delete(id);
      showToast("success", "Thành công", "Đã xóa banner");
      await loadBanners();
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa banner",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Banner</h1>
        <Link to="/admin/banners/create" className="btn btn-primary">
          <i className="bx bx-plus"></i> Thêm banner
        </Link>
      </div>

      <div
        className="banner-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "24px",
        }}
      >
        {banners.length > 0 ? (
          banners.map((banner) => (
            <div key={banner.id} className="banner-card card">
              <div
                style={{
                  position: "relative",
                  paddingTop: "50%",
                  background: "var(--bg-void)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title || "Banner"}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{ position: "absolute", top: "12px", right: "12px" }}
                >
                  {banner.isActive ? (
                    <span className="badge badge-new">Active</span>
                  ) : (
                    <span className="badge badge-soldout">Inactive</span>
                  )}
                </div>
              </div>
              <div className="card-body">
                <h4 className="mb-2">{banner.title || "Banner"}</h4>
                <p className="text-muted mb-2" style={{ fontSize: "13px" }}>
                  {banner.subtitle}
                </p>
                <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                  Vị trí: <span>{banner.position}</span> | Thứ tự:{" "}
                  <span>{banner.displayOrder}</span>
                </p>
              </div>
              <div className="card-footer d-flex justify-between">
                <Link
                  to={`/admin/banners/${banner.id}/edit`}
                  className="btn btn-ghost btn-sm"
                >
                  <i className="bx bx-edit"></i> Sửa
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-danger"
                  onClick={() => handleDelete(banner.id)}
                >
                  <i className="bx bx-trash"></i> Xóa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            className="text-center text-muted p-5"
            style={{ gridColumn: "1 / -1" }}
          >
            <i
              className="bx bx-image"
              style={{
                fontSize: "48px",
                display: "block",
                marginBottom: "16px",
              }}
            ></i>
            Chưa có banner nào
          </div>
        )}
      </div>
    </>
  );
};

export default Banners;
