import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useState } from 'react';

const Cart = () => {
  const { 
    items, 
    cartTotalAmount, 
    selectedItemsCount, 
    updateQuantity, 
    toggleSelect, 
    toggleSelectAll, 
    removeItem, 
    clearCart 
  } = useCart();
  
  const { showToast } = useToast();
  
  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const shippingFee = cartTotalAmount > 0 ? (cartTotalAmount > 5000000 ? 0 : 300000) : 0; // Giả sử đơn > 5tr freeship, <=5tr tính ship 30k
  const freeShippingThreshold = 5000000;
  const isAllSelected = items.length > 0 && items.every(i => i.isSelected);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showToast('warning', 'Cảnh báo', 'Vui lòng nhập mã giảm giá');
      return;
    }
    
    setApplyingVoucher(true);
    
    try {
      // Giả lập gọi API kiểm tra voucher
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (voucherCode.toUpperCase() === 'ARGATY100') {
        setDiscountAmount(100000);
        showToast('success', 'Thành công', 'Đã áp dụng mã giảm giá 100K');
      } else {
        setDiscountAmount(0);
        showToast('error', 'Lỗi', 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }
    } finally {
      setApplyingVoucher(false);
    }
  };

  const finalTotalAmount = cartTotalAmount + shippingFee - discountAmount;

  return (
    <div className="cart-page" style={{ padding: '120px 0 80px' }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <div className="breadcrumb__item">
            <Link to="/"><i className="bx bx-home"></i> Trang chủ</Link>
          </div>
          <span className="breadcrumb__separator"><i className="bx bx-chevron-right"></i></span>
          <div className="breadcrumb__item">Giỏ hàng</div>
        </nav>

        <h1 className="section-title mb-4">Giỏ hàng của bạn</h1>

        {items.length === 0 ? (
          // Empty Cart
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="bx bx-cart"></i>
            </div>
            <h3 className="empty-state__title">Giỏ hàng trống</h3>
            <p className="empty-state__desc">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy tiếp tục mua sắm!
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              <i className="bx bx-shopping-bag"></i> Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          // Cart Content
          <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
            <div className="cart-items">
              <div className="cart-table">
                {/* Header */}
                <div className="cart-table__header">
                  <div className="cart-table__header-cell">
                    <input
                      type="checkbox"
                      id="selectAll"
                      className="cart-item__checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </div>
                  <div className="cart-table__header-cell">Sản phẩm</div>
                  <div className="cart-table__header-cell">Đơn giá</div>
                  <div className="cart-table__header-cell">Số lượng</div>
                  <div className="cart-table__header-cell">Thành tiền</div>
                  <div className="cart-table__header-cell"></div>
                </div>

                {/* Items */}
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div>
                      <input
                        type="checkbox"
                        className="cart-item__checkbox item-checkbox"
                        checked={item.isSelected}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </div>

                    <div className="cart-item__product">
                      <div className="cart-item__image">
                        <Link to={`/products/${item.productSlug}`}>
                          <img src={item.productImage} alt={item.productName} />
                        </Link>
                      </div>
                      <div className="cart-item__info">
                        <Link to={`/products/${item.productSlug}`} className="cart-item__name">
                          {item.productName}
                        </Link>
                        {item.variantName && (
                          <div className="cart-item__variant">
                            <span>{item.variantName}</span>
                          </div>
                        )}
                        {!item.isInStock && (
                          <div className="text-danger" style={{ fontSize: '12px' }}>
                            <i className="bx bx-error"></i> Hết hàng
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="cart-item__price">
                      {item.unitPrice.toLocaleString('vi-VN')} ₫
                    </div>

                    <div className="cart-item__quantity">
                      <div className="quantity-selector">
                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <i className="bx bx-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          min="1"
                          max={item.availableQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              updateQuantity(item.id, val);
                            }
                          }}
                        />
                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <i className="bx bx-plus"></i>
                        </button>
                      </div>
                    </div>

                    <div className="cart-item__subtotal">
                      {item.subtotal.toLocaleString('vi-VN')} ₫
                    </div>

                    <div>
                      <button className="cart-item__remove" onClick={() => removeItem(item.id)} title="Xóa">
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="cart-actions mt-4 d-flex justify-between align-center flex-wrap gap-3">
                <Link to="/products" className="btn btn-ghost">
                  <i className="bx bx-left-arrow-alt"></i> Tiếp tục mua sắm
                </Link>
                <button className="btn btn-dark" onClick={clearCart}>
                  <i className="bx bx-trash"></i> Xóa giỏ hàng
                </button>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="cart-summary-wrapper">
              <div className="cart-summary">
                <h3 className="cart-summary__title">Tóm tắt đơn hàng</h3>

                {/* Voucher */}
                <div className="voucher-section mb-4">
                  <label className="form-label">Mã giảm giá</label>
                  <div className="voucher-form">
                    <input
                      type="text"
                      className="form-control"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Nhập Argaty100"
                    />
                    <button 
                      className="btn btn-dark" 
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher}
                    >
                      {applyingVoucher ? <i className="bx bx-loader-alt bx-spin"></i> : 'Áp dụng'}
                    </button>
                  </div>
                  
                  {/* Có thể render danh sách các mã có sẵn ở đây */}
                </div>

                <div className="cart-summary__row">
                  <span className="cart-summary__label">Tạm tính ({selectedItemsCount} sản phẩm)</span>
                  <span className="cart-summary__value">{cartTotalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>

                <div className="cart-summary__row">
                  <span className="cart-summary__label">Phí vận chuyển</span>
                  <span className="cart-summary__value">
                    {shippingFee === 0 ? <span className="text-success">Miễn phí</span> : `${shippingFee.toLocaleString('vi-VN')} ₫`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="cart-summary__row">
                    <span className="cart-summary__label">Giảm giá</span>
                    <span className="cart-summary__value text-success">
                      -{discountAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                )}

                {/* Free Shipping Progress */}
                {cartTotalAmount < freeShippingThreshold && (
                  <div className="free-shipping-progress mt-3 p-3" style={{ background: 'var(--bg-void)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px' }}>
                      <i className="bx bx-gift text-primary"></i> Mua thêm <span className="text-cyan">{(freeShippingThreshold - cartTotalAmount).toLocaleString('vi-VN')} ₫</span> để được miễn phí ship
                    </p>
                    <div className="rating-bar__track mt-2">
                      <div className="rating-bar__fill" style={{ width: `${(cartTotalAmount / freeShippingThreshold) * 100}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="cart-summary__total">
                  <span className="cart-summary__total-label">Tổng cộng</span>
                  <span className="cart-summary__total-value">{Math.max(0, finalTotalAmount).toLocaleString('vi-VN')} ₫</span>
                </div>

                <Link 
                  to="/checkout" 
                  className={`btn btn-primary btn-lg btn-block mt-4 ${selectedItemsCount === 0 ? 'disabled' : ''}`}
                  onClick={(e) => selectedItemsCount === 0 && e.preventDefault()}
                >
                  <i className="bx bx-credit-card"></i> Tiến hành thanh toán
                </Link>

                <p className="text-center text-muted mt-3" style={{ fontSize: '12px' }}>
                  <i className="bx bx-lock-alt"></i> Thanh toán an toàn & bảo mật
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
