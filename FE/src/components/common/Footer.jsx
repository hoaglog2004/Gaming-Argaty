import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer" style={{ backgroundColor: '#0c0a1d', borderTop: '1px solid #1f1d2e', paddingTop: '60px' }}>
      <div className="container">
        <div className="footer__top section">
          <div className="footer__grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr',
            gap: '40px'
          }}>
            <div className="footer__brand">
              <Link
                to="/"
                className="footer__logo mb-3 d-inline-flex align-items-center gap-2 text-decoration-none"
              >
                <div
                  className="footer__logo-icon"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white'
                  }}
                >
                  <i className="bx bx-planet"></i>
                </div>
                <span
                  className="footer__logo-text"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '24px',
                    fontWeight: 800,
                    background: 'linear-gradient(to right, #fff, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  ARGATY
                </span>
              </Link>
              <p className="footer__desc text-muted mb-4" style={{ lineHeight: 1.6 }}>
                Thiên đường Gaming Gear cho game thủ Việt. <br />
                Chính hãng, giá tốt, giao hàng toàn quốc.
              </p>

              <div className="footer__social d-flex gap-3">
                <a href="#" className="social-link facebook">
                  <i className="bx bxl-facebook"></i>
                </a>
                <a href="#" className="social-link instagram">
                  <i className="bx bxl-instagram"></i>
                </a>
                <a href="#" className="social-link youtube">
                  <i className="bx bxl-youtube"></i>
                </a>
                <a href="#" className="social-link discord">
                  <i className="bx bxl-discord-alt"></i>
                </a>
              </div>
            </div>

            <div className="footer__links">
              <h4 className="footer__title text-white text-uppercase fw-bold mb-4" style={{ fontSize: '16px', letterSpacing: '1px' }}>
                Về chúng tôi
              </h4>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><Link to="/about" className="footer-link">Giới thiệu</Link></li>
                <li><Link to="/products" className="footer-link">Sản phẩm</Link></li>
                <li><Link to="/blog" className="footer-link">Tin tức công nghệ</Link></li>
                <li><Link to="/contact" className="footer-link">Liên hệ hợp tác</Link></li>
              </ul>
            </div>

            <div className="footer__links">
              <h4 className="footer__title text-white text-uppercase fw-bold mb-4" style={{ fontSize: '16px', letterSpacing: '1px' }}>
                Hỗ trợ khách hàng
              </h4>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><Link to="/faq" className="footer-link">Câu hỏi thường gặp</Link></li>
                <li><Link to="/policy/shipping" className="footer-link">Chính sách vận chuyển</Link></li>
                <li><Link to="/policy/warranty" className="footer-link">Chính sách bảo hành</Link></li>
                <li><Link to="/policy/return" className="footer-link">Đổi trả hàng</Link></li>
              </ul>
            </div>

            <div className="footer__contact">
              <h4 className="footer__title text-white text-uppercase fw-bold mb-4" style={{ fontSize: '16px', letterSpacing: '1px' }}>
                Liên hệ
              </h4>
              <div className="d-flex flex-column gap-3">
                <div className="contact-item d-flex align-items-start gap-3">
                  <i className="bx bx-map text-primary fs-5 mt-1"></i>
                  <span className="text-muted">127 Nguyễn Văn Linh, Hải Châu, TP.Đà Nẵng</span>
                </div>
                <div className="contact-item d-flex align-items-center gap-3">
                  <i className="bx bx-phone text-primary fs-5"></i>
                  <span className="text-white fw-bold">1900 123 456</span>
                </div>
                <div className="contact-item d-flex align-items-center gap-3">
                  <i className="bx bx-envelope text-primary fs-5"></i>
                  <a href="mailto:support@argaty.com" className="text-muted text-decoration-none hover-white">
                    support@argaty.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer__bottom py-4 mt-4 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <p className="m-0 text-muted small">
            &copy; 2024 Argaty. All rights reserved.
          </p>

          <div className="payment-methods d-flex gap-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Paypal_2014_logo.png"
              alt="PayPal"
              height="20"
              style={{ opacity: 0.7 }}
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
              alt="Mastercard"
              height="20"
              style={{ opacity: 0.7 }}
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"
              alt="Visa"
              height="15"
              style={{ opacity: 0.7, marginTop: '2px' }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
