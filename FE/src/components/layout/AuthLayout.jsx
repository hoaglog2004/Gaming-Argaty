import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <>
      <div className="cosmic-bg">
        <div className="stars"></div>
        <div className="stars-2"></div>
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>
      
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <Link to="/" className="auth-logo">
                <div className="auth-logo__icon">
                  <i className="bx bx-planet"></i>
                </div>
                <span className="auth-logo__text">ARGATY</span>
              </Link>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
