import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { catalogApi } from "../services/apiServices";
import SkeletonLoader from "../components/common/SkeletonLoader";
import "./ProductDetail.css";

const unique = (items) =>
  items.filter((item, index, arr) => item && arr.indexOf(item) === index);

const parseSpecifications = (raw) => {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes(":"))
    .map((line) => {
      const [key, ...rest] = line.split(":");
      return { key: (key || "").trim(), value: rest.join(":").trim() };
    })
    .filter((item) => item.key && item.value);
};

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("specsTab");
  const [tier1, setTier1] = useState(null);
  const [tier2, setTier2] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await catalogApi.getProductBySlug(slug);
        setProduct(data);

        const gallery = (data?.images || [])
          .map((img) => img?.imageUrl)
          .filter(Boolean);
        const firstImage =
          gallery[0] || data?.mainImage || "/images/no-image.png";
        setMainImage(firstImage);
      } catch {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  const allVariants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product],
  );
  const hasColor = useMemo(
    () =>
      allVariants.some(
        (variant) => String(variant?.color || "").trim().length > 0,
      ),
    [allVariants],
  );
  const hasSize = useMemo(
    () =>
      allVariants.some(
        (variant) => String(variant?.size || "").trim().length > 0,
      ),
    [allVariants],
  );

  const getTier1Value = useCallback(
    (variant) => {
      if (hasColor) return String(variant?.color || "").trim();
      if (hasSize) return String(variant?.size || "").trim();
      return String(variant?.name || `Bien the ${variant?.id || ""}`).trim();
    },
    [hasColor, hasSize],
  );

  const getTier2Value = useCallback(
    (variant) => {
      if (hasColor && hasSize) return String(variant?.size || "").trim();
      return "";
    },
    [hasColor, hasSize],
  );

  const tier1Label = useMemo(() => {
    if (!product) return "Phân loại";
    return (
      (hasColor
        ? product.tier1Name
        : product.tier2Name || product.tier1Name || "Phân loại") || "Phân loại"
    );
  }, [hasColor, product]);

  const tier2Label = useMemo(
    () => product?.tier2Name || "Phân loại 2",
    [product],
  );

  const tier1Options = useMemo(
    () => unique(allVariants.map(getTier1Value)),
    [allVariants, getTier1Value],
  );
  const tier2Options = useMemo(
    () => (hasColor && hasSize ? unique(allVariants.map(getTier2Value)) : []),
    [allVariants, hasColor, hasSize, getTier2Value],
  );

  const selectedVariant = useMemo(() => {
    if (!allVariants.length || !tier1) return null;

    let matched = allVariants.filter(
      (variant) => getTier1Value(variant) === tier1,
    );

    if (tier2Options.length > 0) {
      if (!tier2) return null;
      matched = matched.filter((variant) => getTier2Value(variant) === tier2);
    }

    return (
      matched.find((variant) => Number(variant.quantity || 0) > 0) ||
      matched[0] ||
      null
    );
  }, [allVariants, tier1, tier2, tier2Options, getTier1Value, getTier2Value]);

  const defaultGalleryImages = useMemo(() => {
    if (!product) return [];
    return unique(
      [
        ...(product.images || []).map((img) => img?.imageUrl),
        product.mainImage,
      ].filter(Boolean),
    );
  }, [product]);

  const displayedImages = useMemo(() => {
    const base = defaultGalleryImages;
    if (!selectedVariant) return base;

    const variantImages = Array.isArray(selectedVariant.images)
      ? selectedVariant.images.filter(Boolean)
      : [];
    const fallback = selectedVariant.imageUrl ? [selectedVariant.imageUrl] : [];
    return unique([...variantImages, ...fallback, ...base]);
  }, [defaultGalleryImages, selectedVariant]);

  const resolveVariant = useCallback(
    (nextTier1, nextTier2) => {
      if (!allVariants.length || !nextTier1) return null;

      let matched = allVariants.filter(
        (variant) => getTier1Value(variant) === nextTier1,
      );

      if (tier2Options.length > 0) {
        if (!nextTier2) return null;
        matched = matched.filter(
          (variant) => getTier2Value(variant) === nextTier2,
        );
      }

      return (
        matched.find((variant) => Number(variant.quantity || 0) > 0) ||
        matched[0] ||
        null
      );
    },
    [
      allVariants,
      getTier1Value,
      getTier2Value,
      tier2Options.length,
    ],
  );

  const applyVariantMainImage = useCallback(
    (variant) => {
      if (!variant) return;
      const variantImages = Array.isArray(variant.images)
        ? variant.images.filter(Boolean)
        : [];
      const next = variantImages[0] || variant.imageUrl;
      if (next) setMainImage(next);
    },
    [],
  );

  const activeMainImage = useMemo(() => {
    if (displayedImages.includes(mainImage)) return mainImage;
    return displayedImages[0] || "/images/no-image.png";
  }, [displayedImages, mainImage]);

  const isTier1Disabled = (option) => {
    const candidates = allVariants.filter(
      (variant) => getTier1Value(variant) === option,
    );
    if (!tier2) {
      return !candidates.some((variant) => Number(variant.quantity || 0) > 0);
    }
    return !candidates.some(
      (variant) =>
        getTier2Value(variant) === tier2 && Number(variant.quantity || 0) > 0,
    );
  };

  const isTier2Disabled = (option) => {
    const candidates = allVariants.filter(
      (variant) => getTier2Value(variant) === option,
    );
    if (!tier1) {
      return !candidates.some((variant) => Number(variant.quantity || 0) > 0);
    }
    return !candidates.some(
      (variant) =>
        getTier1Value(variant) === tier1 && Number(variant.quantity || 0) > 0,
    );
  };

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant?.finalPrice != null)
      return Number(selectedVariant.finalPrice || 0);
    return Number(product.salePrice || product.price || 0);
  }, [product, selectedVariant]);

  const originalPrice = Number(product?.price || 0);
  const availableQuantity = Number(
    selectedVariant?.quantity ?? product?.quantity ?? 0,
  );
  const requireCompleteSelection =
    allVariants.length > 0 && !!tier1 && (tier2Options.length === 0 || !!tier2);
  const canBuy =
    (allVariants.length > 0
      ? requireCompleteSelection && !!selectedVariant
      : true) && availableQuantity > 0;

  const specCards = useMemo(
    () => parseSpecifications(product?.specifications),
    [product?.specifications],
  );

  const handleTier1Click = (option) => {
    if (isTier1Disabled(option)) return;
    const next = tier1 === option ? null : option;
    setTier1(next);

    let nextTier2 = tier2;
    if (
      next &&
      tier2 &&
      !allVariants.some(
        (variant) =>
          getTier1Value(variant) === next && getTier2Value(variant) === tier2,
      )
    ) {
      nextTier2 = null;
      setTier2(null);
    }

    applyVariantMainImage(resolveVariant(next, nextTier2));
  };

  const handleTier2Click = (option) => {
    if (isTier2Disabled(option)) return;
    const nextTier2 = tier2 === option ? null : option;
    setTier2(nextTier2);
    applyVariantMainImage(resolveVariant(tier1, nextTier2));
  };

  const handleAddToCart = async () => {
    if (!product || !canBuy) return;
    await addToCart(product, quantity, selectedVariant || null);
  };

  const changeQuantity = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (availableQuantity && next > availableQuantity)
        return availableQuantity;
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "120px 0" }}>
        <SkeletonLoader type="product-detail" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: "120px 0", textAlign: "center" }}>
        <h3>Không tìm thấy sản phẩm.</h3>
        <Link to="/products" className="btn btn-primary mt-4">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <nav className="cosmic-breadcrumb">
          <Link to="/">
            TRANG CHỦ
          </Link>
          <span>/</span>
          <Link to="/products">
            SẢN PHẨM
          </Link>
          <span>/</span>
          <span className="text-white">{product.name.toUpperCase()}</span>
        </nav>

        <div className="product-main-grid">
          <div className="gallery-wrapper">
            <div className="main-image-box">
              <img
                src={activeMainImage}
                alt={product.name}
                style={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  objectFit: "contain",
                }}
              />
              <div className="image-badges">
                {product.isOnSale && (
                  <span className="discount-tag sale">
                    -{product.discountPercent || 0}%
                  </span>
                )}
                {product.isNew && (
                  <span className="discount-tag new">
                    NEW
                  </span>
                )}
              </div>
            </div>

            {displayedImages.length > 1 && (
              <div className="thumb-list">
                {displayedImages.map((img) => (
                  <div
                    key={img}
                    className="thumb-item"
                    onClick={() => setMainImage(img)}
                    style={{
                      border: `2px solid ${activeMainImage === img ? "var(--primary)" : "transparent"}`,
                    }}
                  >
                    <img src={img} alt="thumb" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            {product.brand?.name ? (
              <span className="product-brand">
                {product.brand.name}
              </span>
            ) : null}
            <h1 className="product-title">
              {product.name}
            </h1>

            <div className="product-price-box">
              <span className="current-price">
                {finalPrice.toLocaleString("vi-VN")} đ
              </span>
              {product.isOnSale && originalPrice > finalPrice ? (
                <span className="old-price">
                  {originalPrice.toLocaleString("vi-VN")} đ
                </span>
              ) : null}
            </div>

            {allVariants.length > 0 && (
              <div id="variant-area" className="product-variants">
                <div className="variant-groups">
                  <div className="variant-section">
                    <div className="variant-title">
                      {tier1Label.toUpperCase()}:{" "}
                      <span style={{ color: "#fff" }}>{tier1 || ""}</span>
                    </div>
                    <div className="variant-grid">
                      {tier1Options.map((option) => {
                        const disabled = isTier1Disabled(option);
                        const selected = tier1 === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={disabled}
                            className={`shopee-option ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                            onClick={() => handleTier1Click(option)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {tier2Options.length > 0 && (
                    <div className="variant-section">
                      <div className="variant-title">
                        {tier2Label.toUpperCase()}:{" "}
                        <span style={{ color: "#fff" }}>{tier2 || ""}</span>
                      </div>
                      <div className="variant-grid">
                        {tier2Options.map((option) => {
                          const disabled = isTier2Disabled(option);
                          const selected = tier2 === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={disabled}
                              className={`shopee-option ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                              style={{
                                minWidth: "96px",
                                padding: "8px 16px",
                                border: "1px solid var(--border)",
                                borderRadius: "2px",
                                background: "#18181b",
                                color: selected ? "var(--primary)" : "#fff",
                                opacity: disabled ? 0.35 : 1,
                                cursor: disabled ? "not-allowed" : "pointer",
                              }}
                              onClick={() => handleTier2Click(option)}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="variant-section qty">
              <div className="variant-title">
                SỐ LƯỢNG
              </div>
              <div className="qty-control">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => changeQuantity(-1)}
                >
                  -
                </button>
                <input
                  type="number"
                  className="qty-input"
                  value={quantity}
                  readOnly
                />
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => changeQuantity(1)}
                >
                  +
                </button>
              </div>
              <span className="text-muted qty-left">
                Còn lại: <strong>{availableQuantity}</strong> sản phẩm
              </span>
            </div>

            <div className="action-buttons">
              <button
                className="btn-add-cart"
                onClick={handleAddToCart}
                disabled={!canBuy}
                style={{ opacity: canBuy ? 1 : 0.6 }}
              >
                <i className="bx bxs-cart-add"></i>{" "}
                {canBuy ? "THÊM VÀO GIỎ HÀNG" : "CHỌN PHÂN LOẠI HỢP LỆ"}
              </button>
            </div>

            <div className="product-desc-short">
              <p>{product.shortDescription}</p>
            </div>
          </div>
        </div>

        <div className="product-content-wrapper">
          <div className="product-tabs">
            <button
              className={`product-tab-btn ${activeTab === "specsTab" ? "active" : ""}`}
              onClick={() => setActiveTab("specsTab")}
            >
              <i className="bx bx-list-ul"></i> Thông số kỹ thuật
            </button>
            <button
              className={`product-tab-btn ${activeTab === "descTab" ? "active" : ""}`}
              onClick={() => setActiveTab("descTab")}
            >
              <i className="bx bx-detail"></i> Mô tả sản phẩm
            </button>
          </div>

          {activeTab === "specsTab" && (
            <>
              {specCards.length > 0 ? (
                <div className="specs-grid-cards">
                  {specCards.map((spec) => (
                    <div
                      key={`${spec.key}-${spec.value}`}
                      className="spec-card-item"
                    >
                      <div className="spec-icon-wrap">
                        <i className="bx bx-check-shield text-xl text-primary"></i>
                      </div>
                      <div className="spec-card-label">
                        {spec.key}
                      </div>
                      <div className="spec-card-value">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ marginBottom: "40px" }}>
                  Chưa có thông số kỹ thuật.
                </div>
              )}
            </>
          )}

          {activeTab === "descTab" && (
            <div className="description-box" style={{ background: "#18181b", padding: "30px", borderRadius: "12px", border: "1px solid var(--border)", color: "#e4e4e7", lineHeight: 1.8, fontSize: "16px" }}>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    product.description || "<p>Chưa có mô tả sản phẩm.</p>",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
