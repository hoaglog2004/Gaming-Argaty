import { Link } from "react-router-dom";

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${number.toLocaleString("vi-VN")} ₫`;
};

const ProductCard = ({
  product,
  wishlistIds = [],
  onToggleWishlist,
  onQuickView,
  onAddToCart,
}) => {
  if (!product) {
    return null;
  }

  const price = Number(product.price || 0);
  const salePrice = Number(product.salePrice || 0);
  const computedOnSale = salePrice > 0 && price > 0 && salePrice < price;
  const computedHasDiscountPercent = Number(product.discountPercent || 0) > 0;
  const isOnSale = product.isOnSale ?? (computedOnSale || computedHasDiscountPercent);
  const discountPercent =
    Number(product.discountPercent || 0) ||
    (isOnSale && price > 0
      ? Math.round(((price - salePrice) / price) * 100)
      : 0);

  const isNew = Boolean(product.isNew);
  const isBestSeller = Boolean(product.isBestSeller ?? product.isHot);
  const isInStock =
    product.isInStock !== undefined ? Boolean(product.isInStock) : true;
  const isWishlisted = wishlistIds.includes(Number(product.id));

  const rating = Number(product.rating || 0);
  const reviewCount = Number(product.reviewCount || 0);
  const ratingStars = Array.from({ length: 5 }, (_, index) => index + 1);

  const finalPrice = isOnSale && salePrice > 0 ? salePrice : price;
  const productLink = `/products/${product.slug}`;
  const categoryLink = product.categorySlug
    ? `/products?category=${product.categorySlug}`
    : "/products";

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onAddToCart) {
      await onAddToCart(product);
    }
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  const handleQuickView = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <div className="product-card">
      <div className="product-card__image">
        <Link to={productLink}>
          <img
            src={product.mainImage || "/images/no-image.png"}
            alt={product.name}
            loading="lazy"
          />
        </Link>

        <div className="product-card__badges">
          {isOnSale && <span className="badge badge-sale">-{discountPercent}%</span>}
          {isNew && <span className="badge badge-new">Mới</span>}
          {isBestSeller && <span className="badge badge-hot">Hot</span>}
          {!isInStock && <span className="badge badge-soldout">Hết hàng</span>}
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            className={`product-card__action-btn wishlist-btn ${isWishlisted ? "active" : ""}`}
            title="Yêu thích"
            onClick={handleWishlist}
          >
            <i className={`bx ${isWishlisted ? "bxs-heart" : "bx-heart"}`}></i>
          </button>
          <button
            type="button"
            className="product-card__action-btn quick-view-btn"
            title="Xem nhanh"
            onClick={handleQuickView}
          >
            <i className="bx bx-show"></i>
          </button>
        </div>

        {isInStock ? (
          <button
            type="button"
            className="product-card__cart-btn add-to-cart-btn"
            onClick={handleAddToCart}
          >
            <i className="bx bx-cart-add"></i>
            <span>Thêm vào giỏ</span>
          </button>
        ) : null}
      </div>

      <div className="product-card__info">
        <Link to={categoryLink} className="product-card__category">
          {product.categoryName || "Danh mục"}
        </Link>

        <h3 className="product-card__name product-card_name">
          <Link to={productLink}>{product.name}</Link>
        </h3>

        {reviewCount > 0 ? (
          <div className="product-card__rating">
            <div className="rating-stars">
              {ratingStars.map((star) => (
                <i
                  key={star}
                  className={star <= rating ? "bx bxs-star" : "bx bx-star empty"}
                ></i>
              ))}
            </div>
            <span className="rating-count">({reviewCount})</span>
          </div>
        ) : null}

        <div className="product-card__price">
          <span className="price-current">{formatCurrency(finalPrice)}</span>
          {isOnSale ? <span className="price-original">{formatCurrency(price)}</span> : null}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
