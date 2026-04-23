import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

const MainLayout = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      <Header />

      <main>
        <Outlet />
      </main>

      <Footer />

      <button 
        id="backToTop" 
        className="btn btn-primary btn-icon"
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 999,
          opacity: showBackToTop ? 1 : 0,
          visibility: showBackToTop ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        <i className="bx bx-up-arrow-alt"></i>
      </button>
    </>
  );
};

export default MainLayout;
