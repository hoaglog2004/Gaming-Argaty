import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductCard from "../components/common/ProductCard";
import { homeApi, newsletterApi } from "../services/apiServices";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";

const normalizeList = (payload) => (Array.isArray(payload) ? payload : []);

const ProductCarousel = ({
  title,
  subtitle,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth <= 576) {
        setVisibleCount(1);
      } else if (window.innerWidth <= 768) {
        setVisibleCount(2);
      } else if (window.innerWidth <= 1200) {
        setVisibleCount(3);
      } else {
        setVisibleCount(4);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const maxIndex = Math.max(0, products.length - visibleCount);

  if (!products.length) return null;

  const isStatic = products.length <= visibleCount;
  const safeIndex = Math.min(currentIndex, maxIndex);
  const gapPx = 24;
  const itemWidthCalc = `(100% - ${(visibleCount - 1) * gapPx}px) / ${visibleCount}`;
  const trackTransform = `translateX(calc(-${safeIndex} * (${itemWidthCalc} + ${gapPx}px)))`;

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title text-gradient">{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>

        <div className={`products-carousel ${isStatic ? "is-static" : ""}`}>
          <div
            className="products-carousel__viewport"
            style={{ width: "100%" }}
          >
            <div
              className="products-carousel__track"
              style={{ transform: trackTransform }}
            >
              {products.map((product) => (
                <div key={product.id} className="products-carousel__item">
                  <ProductCard
                    product={product}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </div>

          {!isStatic && (
            <>
              <button
                type="button"
                className="products-carousel__nav products-carousel__nav--prev"
                onClick={() => {
                  if (maxIndex <= 0) return;
                  setCurrentIndex(safeIndex <= 0 ? maxIndex : safeIndex - 1);
                }}
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              <button
                type="button"
                className="products-carousel__nav products-carousel__nav--next"
                onClick={() => {
                  if (maxIndex <= 0) return;
                  setCurrentIndex(safeIndex >= maxIndex ? 0 : safeIndex + 1);
                }}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const [sliderBanners, setSliderBanners] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await homeApi.data();
        setSliderBanners(normalizeList(data?.sliderBanners));
        setFeaturedCategories(normalizeList(data?.featuredCategories));
        setBrands(normalizeList(data?.brands));
        setFeaturedProducts(normalizeList(data?.featuredProducts));
        setNewProducts(normalizeList(data?.newProducts));
        setBestSellerProducts(normalizeList(data?.bestSellerProducts));
      } catch {
        setSliderBanners([]);
        setFeaturedCategories([]);
        setBrands([]);
        setFeaturedProducts([]);
        setNewProducts([]);
        setBestSellerProducts([]);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!sliderBanners.length) return undefined;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % sliderBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderBanners]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1, null);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.message || "Không thể thêm vào giỏ hàng",
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
      navigate("/auth/login", { state: { redirectTo: "/" } });
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

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      showToast("warning", "Cảnh báo", "Vui lòng nhập email");
      return;
    }
    try {
      setNewsletterLoading(true);
      await newsletterApi.subscribe(newsletterEmail.trim());
      showToast("success", "Thành công", "Đăng ký nhận tin thành công");
      setNewsletterEmail("");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Không thể đăng ký newsletter",
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div>
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__badge">
              <i className="bx bx-rocket"></i>
              <span>Gaming Gear Premium</span>
            </div>

            <h1 className="hero__title">
              <span className="hero__title-line">Nâng tầm</span>
              <span className="hero__title-line">Trải nghiệm Gaming</span>
            </h1>

            <p className="hero__desc">
              Khám phá bộ sưu tập Gaming Gear cao cấp từ các thương hiệu hàng
              đầu thế giới.
            </p>

            <div className="hero__actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                <i className="bx bx-shopping-bag"></i>
                <span>Mua sắm ngay</span>
              </Link>
              <Link to="/products/sale" className="btn btn-outline btn-lg">
                <i className="bx bx-purchase-tag"></i>
                <span>Khuyến mãi hot</span>
              </Link>
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <div className="hero__stat-value">10K+</div>
                <div className="hero__stat-label">Sản phẩm</div>
              </div>
              <div className="hero__stat">
                <div className="hero__stat-value">50K+</div>
                <div className="hero__stat-label">Khách hàng</div>
              </div>
              <div className="hero__stat">
                <div className="hero__stat-value">99%</div>
                <div className="hero__stat-label">Hài lòng</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__planet"></div>
          <div className="hero__ring"></div>
        </div>
      </section>

      {sliderBanners.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="slider" id="homeSlider">
              <div
                className="slider__track"
                style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
              >
                {sliderBanners.map((banner) => (
                  <div key={banner.id} className="slider__slide">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || "Banner"}
                      className="slider__image"
                    />
                    {banner.title ? (
                      <div className="slider__content">
                        <h2>{banner.title}</h2>
                        <p>{banner.subtitle}</p>
                        {banner.link ? (
                          <Link to={banner.link} className="btn btn-primary">
                            Xem ngay
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <button
                className="slider__nav slider__nav--prev"
                onClick={() =>
                  setBannerIndex(
                    (prev) =>
                      (prev - 1 + sliderBanners.length) % sliderBanners.length,
                  )
                }
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              <button
                className="slider__nav slider__nav--next"
                onClick={() =>
                  setBannerIndex((prev) => (prev + 1) % sliderBanners.length)
                }
              >
                <i className="bx bx-chevron-right"></i>
              </button>
              <div className="slider__dots">
                {sliderBanners.map((banner, index) => (
                  <button
                    key={banner.id}
                    className={`slider__dot ${index === bannerIndex ? "active" : ""}`}
                    onClick={() => setBannerIndex(index)}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {featuredCategories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title text-gradient">Danh mục nổi bật</h2>
              <p className="section-subtitle">
                Khám phá các danh mục sản phẩm gaming gear phổ biến nhất
              </p>
            </div>
            <div className="categories-grid">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug || ""}`}
                  className="category-card"
                >
                  <div
                    className="category-card__icon"
                    style={{ position: "relative" }}
                  >
                    <i
                      className={
                        category.icon?.includes("bx ")
                          ? category.icon
                          : `bx ${category.icon || "bx-category"}`
                      }
                    ></i>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          borderRadius: "50%",
                          position: "relative",
                          zIndex: 2,
                          background: "#fff",
                        }}
                      />
                    ) : null}
                  </div>
                  <h3 className="category-card__name">{category.name}</h3>
                  <span className="category-card__count">
                    {category.productCount || 0} sản phẩm
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProductCarousel
        title="Sản phẩm nổi bật"
        subtitle="Những sản phẩm được yêu thích nhất tại Argaty"
        products={featuredProducts}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />
      <ProductCarousel
        title="Sản phẩm mới"
        subtitle="Cập nhật những sản phẩm mới nhất vừa về kho"
        products={newProducts}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />
      <ProductCarousel
        title="Bán chạy nhất"
        subtitle="Top sản phẩm được mua nhiều nhất trong tháng"
        products={bestSellerProducts}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <section className="section">
        <div className="container">
          <div
            className="features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
            }}
          >
            <div className="card text-center p-4">
              <div
                className="category-card__icon"
                style={{ margin: "0 auto 16px" }}
              >
                <i className="bx bx-rocket"></i>
              </div>
              <h4 className="mb-2">Giao hàng nhanh</h4>
              <p className="text-muted">
                Giao hàng toàn quốc trong 24-48h. Miễn phí ship cho đơn từ 500K
              </p>
            </div>
            <div className="card text-center p-4">
              <div
                className="category-card__icon"
                style={{ margin: "0 auto 16px" }}
              >
                <i className="bx bx-shield-quarter"></i>
              </div>
              <h4 className="mb-2">Chính hãng 100%</h4>
              <p className="text-muted">
                Cam kết sản phẩm chính hãng. Hoàn tiền 200% nếu phát hiện hàng
                giả
              </p>
            </div>
            <div className="card text-center p-4">
              <div
                className="category-card__icon"
                style={{ margin: "0 auto 16px" }}
              >
                <i className="bx bx-refresh"></i>
              </div>
              <h4 className="mb-2">Đổi trả dễ dàng</h4>
              <p className="text-muted">
                Đổi trả miễn phí trong 30 ngày nếu sản phẩm lỗi do nhà sản xuất
              </p>
            </div>
            <div className="card text-center p-4">
              <div
                className="category-card__icon"
                style={{ margin: "0 auto 16px" }}
              >
                <i className="bx bx-support"></i>
              </div>
              <h4 className="mb-2">Hỗ trợ 24/7</h4>
              <p className="text-muted">
                Đội ngũ CSKH sẵn sàng hỗ trợ bạn mọi lúc mọi nơi
              </p>
            </div>
          </div>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Thương hiệu đối tác</h2>
            </div>
            <div
              className="brands-slider"
              style={{
                display: "flex",
                gap: "40px",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brand=${brand.slug || ""}`}
                  className="brand-item hover-scale"
                  style={{ opacity: 0.6, transition: "opacity 0.3s" }}
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      style={{
                        height: "50px",
                        objectFit: "contain",
                        maxWidth: "120px",
                      }}
                    />
                  ) : (
                    <span style={{ fontWeight: "bold", color: "white" }}>
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div
            className="card glass p-5"
            style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}
          >
            <div
              className="category-card__icon"
              style={{
                margin: "0 auto 20px",
                background: "var(--gradient-aurora)",
              }}
            >
              <i className="bx bx-envelope"></i>
            </div>
            <h3 className="text-gradient mb-3">Đăng ký nhận tin</h3>
            <p className="text-muted mb-4">
              Nhận thông tin khuyến mãi, sản phẩm mới và ưu đãi độc quyền từ
              Argaty
            </p>
            <form
              className="input-group"
              style={{ maxWidth: "450px", margin: "0 auto" }}
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                className="form-control"
                placeholder="Nhập email của bạn..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={newsletterLoading}
              >
                <i className="bx bx-send"></i>
                {newsletterLoading ? " Đang gửi..." : " Đăng ký"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
