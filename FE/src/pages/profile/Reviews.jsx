import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { reviewApi } from "../../services/apiServices";

const Reviews = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    const page = await reviewApi.myReviews({ page: 0, size: 20 });
    return page?.content || [];
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const list = await fetchReviews();
        if (isMounted) setReviews(list);
      } catch {
        if (isMounted) setReviews([]);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await reviewApi.remove(id);
      const list = await fetchReviews();
      setReviews(list);
      showToast("success", "Thành công", "Đã xóa đánh giá");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa đánh giá",
      );
    }
  };

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Đánh giá của tôi</h2>
      </div>

      <div className="reviews-list">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="review-card card p-4 mb-4">
              <div className="d-flex gap-4">
                <Link
                  to={`/products/${review.productSlug}`}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={review.productImage || "/images/no-image.png"}
                    alt={review.productName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Link>

                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-between align-center mb-2">
                    <div>
                      <Link
                        to={`/products/${review.productSlug}`}
                        style={{ fontWeight: 600 }}
                      >
                        {review.productName}
                      </Link>
                      <p
                        className="text-muted"
                        style={{ fontSize: "12px", marginTop: "4px" }}
                      >
                        Đánh giá ngày{" "}
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="d-flex" style={{ color: "var(--warning)" }}>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bx ${i < review.rating ? "bxs-star" : "bx-star"}`}
                        ></i>
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <h5 className="font-medium mb-1">{review.title}</h5>
                  )}
                  <p
                    className="text-secondary"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {review.comment}
                  </p>

                  {review.reply && (
                    <div className="review-reply mt-3">
                      <div className="review-reply__header">
                        <span className="review-reply__name">ARGATY</span>
                        <span className="review-reply__badge">
                          Shop phản hồi
                        </span>
                      </div>
                      <p className="review-reply__content">{review.reply}</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => handleDelete(review.id)}
                    >
                      <i className="bx bx-trash"></i> Xóa đánh giá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="bx bx-star"></i>
            </div>
            <h3 className="empty-state__title">Chưa có đánh giá nào</h3>
            <p className="empty-state__desc">
              Mua hàng và đánh giá sản phẩm để nhận ưu đãi nhé!
            </p>
            <Link to="/profile/orders" className="btn btn-primary">
              Viết đánh giá ngay
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Reviews;
