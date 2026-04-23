import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/common/ProductCard";
import { catalogApi } from "../services/apiServices";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";

const Products = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

  const page = Number(searchParams.get("page") || 0);
  const sort = searchParams.get("sort") || "newest";
  const q = searchParams.get("q") || "";
  const isSalePage = location.pathname === "/products/sale";

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("brand") || "",
  );

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const finalResponse = isSalePage
          ? await catalogApi.saleProducts({ page, size: 6 })
          : await catalogApi.listProducts({ page, size: 6, sort, q });
        setProducts(finalResponse?.content || []);
        setMeta({
          page: finalResponse?.page || 0,
          totalPages: finalResponse?.totalPages || 0,
          totalElements: finalResponse?.totalElements || 0,
        });
      } catch {
        setProducts([]);
        setMeta({ page: 0, totalPages: 0, totalElements: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page, sort, q, isSalePage]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((item) => {
      const key = item.categorySlug || item.categoryName;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          slug: item.categorySlug,
          name: item.categoryName,
          count: 0,
        });
      }
      map.get(key).count += 1;
    });
    return Array.from(map.values());
  }, [products]);

  const brands = useMemo(() => {
    const map = new Map();
    products.forEach((item) => {
      const key = item.brandSlug || item.brandName;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { slug: item.brandSlug, name: item.brandName, count: 0 });
      }
      map.get(key).count += 1;
    });
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const passCategory =
        !selectedCategory || item.categorySlug === selectedCategory;
      const passBrand = !selectedBrand || item.brandSlug === selectedBrand;
      return passCategory && passBrand;
    });
  }, [products, selectedBrand, selectedCategory]);

  const updateQuery = (key, value) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    if (key !== "page") {
      searchParams.set("page", "0");
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateQuery("q", searchInput.trim());
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1, null);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.message || "Không thể thêm sản phẩm vào giỏ hàng",
      );
    }
  };

  const handleToggleWishlist = async (product) => {
    if (!isAuthenticated) {
      showToast(
        "warning",
        "Cần đăng nhập",
        "Vui lòng đăng nhập để lưu sản phẩm yêu thích",
      );
      return;
    }

    try {
      const wishlisted = await toggleWishlist(product.id);
      showToast(
        "success",
        "Thành công",
        wishlisted ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích",
      );
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          "Không thể cập nhật danh sách yêu thích",
      );
    }
  };

  return (
    <div className="products-page" style={{ padding: "120px 0 80px" }}>
      <div className="container">
        <nav className="breadcrumb">
          <div className="breadcrumb__item">
            <Link to="/">
              <i className="bx bx-home"></i> Trang chủ
            </Link>
          </div>
          <span className="breadcrumb__separator">
            <i className="bx bx-chevron-right"></i>
          </span>
          <div className="breadcrumb__item">Sản phẩm</div>
        </nav>

        <div
          className="section-header"
          style={{ textAlign: "left", marginBottom: "30px" }}
        >
          <h1 className="section-title" style={{ fontSize: "2rem" }}>
            {isSalePage ? "Sản phẩm khuyến mãi" : "Sản phẩm"}
          </h1>
          <p className="text-muted">
            Hiển thị {filteredProducts.length} / {meta.totalElements} sản phẩm
          </p>
        </div>

        <div
          className="products-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "30px",
          }}
        >
          <aside className="products-sidebar">
            <div className="products-filter-form">
              <div className="products-filter-form__header mb-3">
                <h3 className="products-filter-form__title">Bộ lọc</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedBrand("");
                  }}
                >
                  <i className="bx bx-refresh"></i> Đặt lại
                </button>
              </div>

              <div className="filter-section card p-4 mb-4">
                <h4 className="filter-title mb-3">
                  <i className="bx bx-category text-primary"></i> Danh mục
                </h4>
                {categories.map((cat) => (
                  <div className="form-check" key={cat.slug || cat.name}>
                    <input
                      type="radio"
                      className="form-check-input"
                      name="category"
                      checked={selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(cat.slug)}
                    />
                    <label className="form-check-label d-flex justify-content-between">
                      <span>{cat.name}</span>
                      <span className="text-muted">({cat.count})</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="filter-section card p-4 mb-4">
                <h4 className="filter-title mb-3">
                  <i className="bx bx-certification text-primary"></i> Thương
                  hiệu
                </h4>
                {brands.map((brand) => (
                  <div className="form-check" key={brand.slug || brand.name}>
                    <input
                      type="radio"
                      className="form-check-input"
                      name="brand"
                      checked={selectedBrand === brand.slug}
                      onChange={() => setSelectedBrand(brand.slug)}
                    />
                    <label className="form-check-label d-flex justify-content-between">
                      <span>{brand.name}</span>
                      <span className="text-muted">({brand.count})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="products-content">
            <div className="products-toolbar card p-3 mb-4 d-flex justify-content-between align-items-center">
              <div className="toolbar-left d-flex align-items-center gap-3">
                <form
                  className="d-flex align-items-center gap-2"
                  onSubmit={handleSearchSubmit}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{ minWidth: "260px" }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <i className="bx bx-search"></i>
                  </button>
                  {q && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSearchInput("");
                        updateQuery("q", "");
                      }}
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  )}
                </form>
                <span className="text-muted sort-label">Sắp xếp:</span>
                <select
                  className="form-control form-select products-sort-select"
                  value={sort}
                  onChange={(e) => updateQuery("sort", e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="name-asc">Tên A-Z</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-muted p-5">
                Đang tải dữ liệu...
              </div>
            ) : (
              <div className="products-grid" id="productsGrid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}

            <div className="pagination mt-5 d-flex justify-content-center">
              <button
                className="btn btn-outline btn-sm me-2"
                disabled={meta.page <= 0}
                onClick={() => updateQuery("page", String(meta.page - 1))}
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              <button className="btn btn-primary btn-sm me-2">
                {meta.page + 1}
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={meta.page + 1 >= meta.totalPages}
                onClick={() => updateQuery("page", String(meta.page + 1))}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
