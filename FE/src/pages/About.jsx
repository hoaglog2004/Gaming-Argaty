import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="about-page" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
      <div className="container">
        <nav className="breadcrumb">
          <div className="breadcrumb__item">
            <Link to="/"><i className="bx bx-home"></i> Trang chủ</Link>
          </div>
          <span className="breadcrumb__separator"><i className="bx bx-chevron-right"></i></span>
          <div className="breadcrumb__item">Giới thiệu</div>
        </nav>

        <div className="section-header text-center mb-5">
          <h1 className="section-title text-gradient display-4">Về ARGATY</h1>
          <p className="section-subtitle lead" style={{ maxWidth: '800px', margin: '0 auto' }}>
            Chúng tôi sinh ra để định nghĩa lại chuẩn mực phụ kiện chơi game tại Việt Nam, mang tới những trải nghiệm "Vượt khỏi vũ trụ".
          </p>
        </div>

        <div className="row mt-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div className="card glass p-4 text-center hover-scale">
            <i className="bx bx-rocket mb-3 text-primary" style={{ fontSize: '48px' }}></i>
            <h3 className="mb-3">Sứ mệnh</h3>
            <p className="text-muted">Đưa công nghệ Gaming Gear hàng đầu thế giới đến tay game thủ Việt Nam một cách nhanh nhất.</p>
          </div>
          <div className="card glass p-4 text-center hover-scale">
            <i className="bx bx-diamond mb-3 text-accent" style={{ fontSize: '48px', color: 'var(--accent)' }}></i>
            <h3 className="mb-3">Tầm nhìn</h3>
            <p className="text-muted">Trở thành nền tảng phân phối số 1 Đông Nam Á trong lĩnh vực thiết bị Thể thao điện tử (Esports).</p>
          </div>
          <div className="card glass p-4 text-center hover-scale">
            <i className="bx bx-heart mb-3 text-danger" style={{ fontSize: '48px', color: '#ef4444' }}></i>
            <h3 className="mb-3">Giá trị cốt lõi</h3>
            <p className="text-muted">Minh bạch - Hiện đại - Đặt trải nghiệm của người dùng làm trung tâm.</p>
          </div>
        </div>

        <div className="story-section mt-5" style={{ display: 'flex', gap: '40px', alignItems: 'center', marginTop: '80px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h2 className="mb-4">Hành trình 2020 - nay</h2>
            <p className="text-muted" style={{ lineHeight: '1.8', fontSize: '16px' }}>
              Bắt đầu từ một dự án khởi nghiệp nhỏ của sinh viên CNTT đam mê thể thao điện tử, ARGATY
              đã sớm khẳng định được vị thế của mình bằng việc hợp tác trực tiếp với các hãng công nghệ lớn
              như Logitech, Razer, Corsair, HyperX...
            </p>
            <p className="text-muted" style={{ lineHeight: '1.8', fontSize: '16px' }}>
              Năm 2026 đánh dấu bước chuyển mình quan trọng khi chuyển sang nền tảng web ReactJS Single-Page hiện đại, 
              tăng tốc độ tải trang gấp 3 lần, mang lại trải nghiệm shopping chuẩn E-commerce quốc tế.
            </p>
          </div>
          <div style={{ flex: '1 1 400px', height: '300px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <i className="bx bx-planet" style={{ fontSize: '150px', color: 'var(--primary)', opacity: 0.5 }}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
