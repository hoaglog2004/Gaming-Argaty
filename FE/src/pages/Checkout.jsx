import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiTag,
  FiUser,
} from "react-icons/fi";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import FormMessage from "../components/common/FormMessage";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { addressApi, checkoutApi } from "../services/apiServices";

const emptyForm = {
  receiverName: "",
  receiverPhone: "",
  receiverEmail: "",
  city: "",
  district: "",
  ward: "",
  shippingAddress: "",
  note: "",
  voucherCode: "",
};

const Checkout = () => {
  const { items, selectedItemsCount, refreshCart } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const [addressLoadError, setAddressLoadError] = useState("");

  const selectedItems = useMemo(
    () => items.filter((i) => i.isSelected),
    [items],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      showToast("warning", "Cần đăng nhập", "Vui lòng đăng nhập để thanh toán");
      navigate("/auth/login", { state: { redirectTo: "/checkout" } });
      return;
    }

    if (selectedItemsCount === 0 && !hasPlacedOrder) {
      showToast(
        "warning",
        "Giỏ hàng trống",
        "Vui lòng chọn sản phẩm để thanh toán",
      );
      navigate("/cart");
    }
  }, [
    authLoading,
    isAuthenticated,
    selectedItemsCount,
    hasPlacedOrder,
    navigate,
    showToast,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setAddressId("");
      return;
    }

    const loadAddresses = async () => {
      try {
        const data = await addressApi.list();
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        setAddressLoadError("");
        const defaultAddress = list.find((addr) => addr.isDefault) || list[0];
        if (defaultAddress) {
          setAddressId(defaultAddress.id);
        }
      } catch {
        setAddresses([]);
        setAddressLoadError(
          "Không thể tải sổ địa chỉ của tài khoản này. Bạn vẫn có thể nhập địa chỉ mới để đặt hàng.",
        );
      }
    };

    loadAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        const response = await fetch("/data.json");
        const data = await response.json();
        setLocationData(Array.isArray(data) ? data : []);
      } catch {
        setLocationData([]);
      }
    };

    loadLocationData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPreview(null);
      return;
    }

    const loadPreview = async () => {
      try {
        const params = addressId
          ? {
              addressId: Number(addressId),
              voucherCode: formData.voucherCode || undefined,
            }
          : {
              city: formData.city || undefined,
              district: formData.district || undefined,
              ward: formData.ward || undefined,
              shippingAddress: formData.shippingAddress || undefined,
              voucherCode: formData.voucherCode || undefined,
            };
        const data = await checkoutApi.preview(params);
        setPreview(data);
      } catch {
        setPreview(null);
      }
    };

    if (selectedItemsCount > 0) {
      loadPreview();
    }
  }, [
    isAuthenticated,
    addressId,
    formData.city,
    formData.district,
    formData.shippingAddress,
    formData.voucherCode,
    formData.ward,
    selectedItemsCount,
  ]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        paymentMethod,
        voucherCode: formData.voucherCode || null,
        note: formData.note || null,
      };

      if (addressId) {
        payload.addressId = Number(addressId);
      } else {
        payload.receiverName = formData.receiverName;
        payload.receiverPhone = formData.receiverPhone;
        payload.receiverEmail = formData.receiverEmail;
        payload.shippingAddress = formData.shippingAddress;
        payload.city = formData.city;
        payload.district = formData.district;
        payload.ward = formData.ward || null;
      }

      const order = await checkoutApi.placeOrder(payload);
      setHasPlacedOrder(true);
      await refreshCart();
      showToast("success", "Thành công", "Đã đặt hàng thành công");

      if (paymentMethod === "COD") {
        navigate(`/profile/orders/${order.orderCode}`);
      } else {
        navigate("/payment", {
          state: {
            orderCode: order.orderCode,
            paymentMethod,
            totalAmount: Number(order.totalAmount || 0),
          },
        });
      }
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Không thể đặt hàng",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const selectedCity = locationData.find((city) => city.Name === formData.city);
  const districtOptions = selectedCity?.Districts || [];
  const selectedDistrict = districtOptions.find(
    (district) => district.Name === formData.district,
  );
  const wardOptions = selectedDistrict?.Wards || [];

  const selectSavedAddress = (id) => {
    setAddressId(id);
  };

  const selectNewAddress = () => {
    setAddressId("");
  };

  const itemsSubtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [selectedItems],
  );
  const shippingFee = Number(preview?.shippingFee || 0);
  const subtotal = Number(preview?.subtotal ?? itemsSubtotal);
  const discountAmount = Number(preview?.discountAmount || 0);
  const finalTotalAmount = Number(
    preview?.totalAmount ??
      Math.max(subtotal - discountAmount + shippingFee, 0),
  );

  if (authLoading) {
    return (
      <div className="checkout-page" style={{ padding: "120px 0 80px" }}>
        <div className="container">
          <SkeletonLoader type="product-detail" />
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{ padding: "120px 0 80px" }}>
      <div className="container">
        <nav className="breadcrumb">
          <div className="breadcrumb__item">
            <Link to="/">
              <FiHome size={16} style={{ marginRight: "6px" }} /> Trang chủ
            </Link>
          </div>
          <span className="breadcrumb__separator">
            <FiChevronRight size={16} />
          </span>
          <div className="breadcrumb__item">
            <Link to="/cart">Giỏ hàng</Link>
          </div>
          <span className="breadcrumb__separator">
            <FiChevronRight size={16} />
          </span>
          <div className="breadcrumb__item">Thanh toán</div>
        </nav>

        <h1 className="section-title mb-4">Thanh toán</h1>

        <form
          id="checkoutForm"
          className="checkout-form-icons"
          onSubmit={handleCheckout}
        >
          <div
            className="checkout-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 420px",
              gap: "30px",
            }}
          >
            <div className="checkout-left">
              <div className="checkout-section">
                <h3 className="checkout-section__title">
                  <FiMapPin className="section-icon" size={18} /> Địa chỉ giao hàng
                </h3>

                {addressLoadError && (
                  <FormMessage type="error" className="mb-3">
                    {addressLoadError}
                  </FormMessage>
                )}

                {addresses.length > 0 && (
                  <div className="address-list">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`address-card ${Number(addressId) === Number(addr.id) ? "selected" : ""}`}
                        onClick={() => selectSavedAddress(addr.id)}
                      >
                        <input
                          type="radio"
                          className="address-card__radio"
                          checked={Number(addressId) === Number(addr.id)}
                          readOnly
                        />
                        <div className="address-card__name">
                          {addr.receiverName}
                        </div>
                        <div className="address-card__phone">{addr.phone}</div>
                        <div className="address-card__detail">
                          {addr.fullAddress}
                        </div>
                        {addr.isDefault && (
                          <span className="address-card__default-badge">
                            Mặc định
                          </span>
                        )}
                      </div>
                    ))}

                    <div
                      className={`address-card ${!addressId ? "selected" : ""}`}
                      onClick={selectNewAddress}
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "150px",
                      }}
                    >
                      <div className="text-center">
                        <FiPlus size={32} style={{ color: "var(--primary)" }} />
                        <p className="text-muted mt-2">Thêm địa chỉ mới</p>
                      </div>
                    </div>
                  </div>
                )}

                {!addressId && (
                  <>
                    <div
                      className="row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label">
                          Họ tên người nhận{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <div className="input-icon input-icon--soft">
                          <FiUser className="input-icon__symbol" size={16} />
                          <input
                            type="text"
                            className="form-control"
                            value={formData.receiverName}
                            onChange={(e) =>
                              setField("receiverName", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Số điện thoại <span className="text-danger">*</span>
                        </label>
                        <div className="input-icon input-icon--soft">
                          <FiPhone className="input-icon__symbol" size={16} />
                          <input
                            type="tel"
                            className="form-control"
                            value={formData.receiverPhone}
                            onChange={(e) =>
                              setField("receiverPhone", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div className="input-icon input-icon--soft">
                        <FiMail className="input-icon__symbol" size={16} />
                        <input
                          type="email"
                          className="form-control"
                          value={formData.receiverEmail}
                          onChange={(e) =>
                            setField("receiverEmail", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div
                      className="row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "20px",
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label">
                          Tỉnh/Thành phố <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control form-select"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              city: e.target.value,
                              district: "",
                              ward: "",
                            }))
                          }
                          required
                        >
                          <option value="">Chọn Tỉnh/TP</option>
                          {locationData.map((city) => (
                            <option key={city.Id} value={city.Name}>
                              {city.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Quận/Huyện <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control form-select"
                          value={formData.district}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              district: e.target.value,
                              ward: "",
                            }))
                          }
                          required
                        >
                          <option value="">Chọn Quận/Huyện</option>
                          {districtOptions.map((district) => (
                            <option key={district.Id} value={district.Name}>
                              {district.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phường/Xã</label>
                        <select
                          className="form-control form-select"
                          value={formData.ward}
                          onChange={(e) => setField("ward", e.target.value)}
                        >
                          <option value="">Chọn Phường/Xã</option>
                          {wardOptions.map((ward) => (
                            <option key={ward.Id} value={ward.Name}>
                              {ward.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Địa chỉ chi tiết <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon input-icon--soft">
                        <FiMapPin className="input-icon__symbol" size={16} />
                        <input
                          type="text"
                          className="form-control"
                          value={formData.shippingAddress}
                          onChange={(e) =>
                            setField("shippingAddress", e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="checkout-section">
                <h3 className="checkout-section__title">
                  <FiCreditCard className="section-icon" size={18} /> Phương thức thanh toán
                </h3>
                <div className="payment-methods">
                  <label
                    className={`payment-method ${paymentMethod === "COD" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <div className="payment-method__icon">
                      <FiDollarSign size={24} />
                    </div>
                    <div className="payment-method__info">
                      <div className="payment-method__name">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                    </div>
                    <FiCheckCircle
                      className="text-success"
                      style={{
                        width: "24px",
                        height: "24px",
                        opacity: paymentMethod === "COD" ? 1 : 0,
                      }}
                    />
                  </label>

                  <label
                    className={`payment-method ${paymentMethod === "BANK_TRANSFER" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  >
                    <div className="payment-method__icon">
                      <FiGrid size={24} />
                    </div>
                    <div className="payment-method__info">
                      <div className="payment-method__name">
                        Bank QR (VietQR)
                      </div>
                    </div>
                    <FiCheckCircle
                      className="text-success"
                      style={{
                        width: "24px",
                        height: "24px",
                        opacity: paymentMethod === "BANK_TRANSFER" ? 1 : 0,
                      }}
                    />
                  </label>

                  <label
                    className={`payment-method ${paymentMethod === "MOMO" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("MOMO")}
                  >
                    <div className="payment-method__icon">
                      <FiCreditCard size={24} />
                    </div>
                    <div className="payment-method__info">
                      <div className="payment-method__name">MoMo</div>
                    </div>
                    <FiCheckCircle
                      className="text-success"
                      style={{
                        width: "24px",
                        height: "24px",
                        opacity: paymentMethod === "MOMO" ? 1 : 0,
                      }}
                    />
                  </label>

                  <label
                    className={`payment-method ${paymentMethod === "ZALOPAY" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("ZALOPAY")}
                  >
                    <div className="payment-method__icon">
                      <FiDollarSign size={24} />
                    </div>
                    <div className="payment-method__info">
                      <div className="payment-method__name">ZaloPay</div>
                    </div>
                    <FiCheckCircle
                      className="text-success"
                      style={{
                        width: "24px",
                        height: "24px",
                        opacity: paymentMethod === "ZALOPAY" ? 1 : 0,
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="checkout-section">
                <h3 className="checkout-section__title">
                  <FiTag className="section-icon" size={18} /> Mã giảm giá
                </h3>
                <div className="input-icon input-icon--soft">
                  <FiTag className="input-icon__symbol" size={16} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã voucher"
                    value={formData.voucherCode}
                    onChange={(e) =>
                      setField("voucherCode", e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>

              <div className="checkout-section">
                <h3 className="checkout-section__title">
                  <FiFileText className="section-icon" size={18} /> Ghi chú đơn hàng
                </h3>
                <div className="form-group mb-0">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.note}
                    onChange={(e) => setField("note", e.target.value)}
                    placeholder="Ghi chú về đơn hàng..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <div
                className="cart-summary"
                style={{ position: "sticky", top: "100px" }}
              >
                <h3 className="cart-summary__title">
                  Đơn hàng của bạn{" "}
                  <span
                    className="text-muted"
                    style={{ fontSize: "14px", fontWeight: "normal" }}
                  >
                    ({selectedItemsCount} sản phẩm)
                  </span>
                </h3>

                <div
                  className="order-items"
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    marginBottom: "20px",
                  }}
                >
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="order-item"
                      style={{ position: "relative" }}
                    >
                      <div
                        className="order-item__image"
                        style={{ position: "relative" }}
                      >
                        <img src={item.productImage} alt={item.productName} />
                        <span
                          className="order-item__qty"
                          style={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            width: "24px",
                            height: "24px",
                            background: "var(--primary)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {item.quantity}
                        </span>
                      </div>
                      <div className="order-item__info">
                        <div className="order-item__name">
                          {item.productName}
                        </div>
                        {item.variantName && (
                          <div className="order-item__variant">
                            {item.variantName}
                          </div>
                        )}
                      </div>
                      <div className="order-item__price">
                        {Number(item.subtotal || 0).toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary__row">
                  <span className="cart-summary__label">Tạm tính</span>
                  <span className="cart-summary__value">
                    {subtotal.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <div className="cart-summary__row">
                  <span className="cart-summary__label">Phí vận chuyển</span>
                  <span className="cart-summary__value text-success">
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString("vi-VN")} ₫`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="cart-summary__row">
                    <span className="cart-summary__label">Giảm giá</span>
                    <span className="cart-summary__value text-success">
                      - {discountAmount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                )}

                <div className="cart-summary__total">
                  <span className="cart-summary__total-label">Tổng cộng</span>
                  <span className="cart-summary__total-value">
                    {finalTotalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-block mt-4"
                  disabled={isSubmitting || selectedItemsCount === 0}
                >
                  <FiCheckCircle size={16} style={{ marginRight: "8px" }} />
                  {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
