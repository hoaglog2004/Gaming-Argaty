import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi } from "../../../services/apiServices";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

const StatusBadge = ({ children, variant }) => (
  <span className={`status-badge status-badge--${variant}`}>{children}</span>
);

const Products = () => {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    searchKeyword: "",
    selectedCategoryId: "",
    selectedBrandId: "",
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadData = async (nextPage = 0, overrideFilters = null) => {
    try {
      const effectiveFilters = overrideFilters || filters;
      const [productData, metadata] = await Promise.all([
        adminApi.products.list({
          page: nextPage,
          size: 6,
          q: effectiveFilters.searchKeyword.trim() || undefined,
          categoryId: effectiveFilters.selectedCategoryId || undefined,
          brandId: effectiveFilters.selectedBrandId || undefined,
        }),
        adminApi.products.metadata(),
      ]);
      const page = productData?.products || productData;
      setProducts(page?.content || []);
      setMeta({
        page: page?.page || nextPage,
        totalPages: page?.totalPages || 0,
        totalElements: page?.totalElements || 0,
      });
      setCategories(metadata?.categories || []);
      setBrands(metadata?.brands || []);
      setSelectedIds([]);
    } catch {
      setProducts([]);
      setMeta({ page: 0, totalPages: 0, totalElements: 0 });
      setCategories([]);
      setBrands([]);
      showToast("error", "Lỗi", "Không thể tải dữ liệu sản phẩm quản trị");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? products.map((item) => item.id) : []);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleFeatured = async (id) => {
    try {
      await adminApi.products.toggleFeatured(id);
      await loadData(meta.page);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái nổi bật",
      );
    }
  };

  const handleToggleNew = async (id) => {
    try {
      await adminApi.products.toggleNew(id);
      await loadData(meta.page);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái sản phẩm mới",
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await adminApi.products.delete(pendingDelete.id);
      showToast("success", "Thành công", "Đã xóa sản phẩm");
      setPendingDelete(null);
      await loadData(meta.page);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa sản phẩm",
      );
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý sản phẩm</h1>
        <div className="admin-page-actions">
          <Link to="/admin/products/create" className="btn btn-primary">
            <i className="bx bx-plus"></i> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <form
        className="admin-filters mb-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await loadData(0);
        }}
      >
        <div className="admin-search">
          <i className="bx bx-search"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Tìm tên, SKU..."
            value={filters.searchKeyword}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                searchKeyword: event.target.value,
              }))
            }
          />
        </div>

        <select
          className="form-control form-select admin-filter-select"
          value={filters.selectedCategoryId}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              selectedCategoryId: event.target.value,
            }))
          }
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          className="form-control form-select admin-filter-select"
          value={filters.selectedBrandId}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              selectedBrandId: event.target.value,
            }))
          }
        >
          <option value="">Tất cả thương hiệu</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary">
          <i className="bx bx-filter-alt"></i>
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          title="Xóa bộ lọc"
          onClick={async () => {
            const cleanFilters = {
              searchKeyword: "",
              selectedCategoryId: "",
              selectedBrandId: "",
            };
            setFilters(cleanFilters);
            await loadData(0, cleanFilters);
          }}
        >
          <i className="bx bx-refresh"></i>
        </button>
      </form>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={
                    Boolean(products.length) &&
                    selectedIds.length === products.length
                  }
                  onChange={(event) => handleSelectAll(event.target.checked)}
                />
              </th>
              <th>Sản phẩm</th>
              <th>SKU</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Kho</th>
              <th>Trạng thái</th>
              <th style={{ width: "120px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => handleToggleSelect(product.id)}
                    />
                  </td>
                  <td>
                    <div className="d-flex align-center gap-3">
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "var(--bg-void)",
                        }}
                      >
                        <img
                          src={product.mainImage || "/images/no-image.png"}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div>
                        <p className="mb-0">{product.name}</p>
                        <small className="text-muted">
                          {product.brandName}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code>{product.sku}</code>
                  </td>
                  <td>{product.categoryName}</td>
                  <td>
                    <span className="text-cyan">
                      {formatCurrency(product.price)}
                    </span>
                    {product.salePrice ? (
                      <small className="text-success d-block">
                        Sale: {formatCurrency(product.salePrice)}
                      </small>
                    ) : null}
                  </td>
                  <td>
                    {product.quantity > 10 ? (
                      <span className="text-success">{product.quantity}</span>
                    ) : null}
                    {product.quantity > 0 && product.quantity <= 10 ? (
                      <span className="text-warning">{product.quantity}</span>
                    ) : null}
                    {product.quantity <= 0 ? (
                      <span className="text-danger">Hết hàng</span>
                    ) : null}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {product.isActive ? (
                        <StatusBadge variant="completed">Active</StatusBadge>
                      ) : (
                        <StatusBadge variant="cancelled">Inactive</StatusBadge>
                      )}
                      {product.isFeatured ? (
                        <StatusBadge variant="confirmed">
                          ★ Featured
                        </StatusBadge>
                      ) : null}
                      {product.isNew ? (
                        <StatusBadge variant="shipping">New</StatusBadge>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="table-action-btn edit"
                        title="Sửa"
                      >
                        <i className="bx bx-edit"></i>
                      </Link>
                      <button
                        type="button"
                        className={`table-action-btn ${product.isFeatured ? "active" : ""}`}
                        title="Featured"
                        onClick={() => handleToggleFeatured(product.id)}
                      >
                        <i className="bx bx-star"></i>
                      </button>
                      <button
                        type="button"
                        className={`table-action-btn ${product.isNew ? "active" : ""}`}
                        title="New"
                        onClick={() => handleToggleNew(product.id)}
                      >
                        <i className="bx bx-badge"></i>
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        title="Xóa"
                        onClick={() => setPendingDelete(product)}
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center text-muted p-5">
                  <i
                    className="bx bx-box"
                    style={{
                      fontSize: "48px",
                      display: "block",
                      marginBottom: "16px",
                    }}
                  ></i>
                  Chưa có sản phẩm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-between align-center mt-4">
        <p className="text-muted mb-0">
          Hiển thị <span>{products.length}</span> /{" "}
          <span>{meta.totalElements}</span> sản phẩm
        </p>
        <div className="pagination pagination--modern" style={{ marginTop: 0 }}>
          <button
            className={`pagination__item pagination__item--nav ${meta.page <= 0 ? "disabled" : ""}`}
            type="button"
            disabled={meta.page <= 0}
            onClick={() => loadData(meta.page - 1)}
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
            onClick={() => loadData(meta.page + 1)}
          >
            <i className="bx bx-chevron-right"></i>
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div className="modal-overlay active">
          <div className="modal" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Xóa sản phẩm</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPendingDelete(null)}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="text-muted">Bạn có chắc muốn xóa sản phẩm này?</p>
              <p className="text-primary">{pendingDelete.name}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPendingDelete(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDelete}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
