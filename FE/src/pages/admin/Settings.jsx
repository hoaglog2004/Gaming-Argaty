const Settings = () => {
    return (
      <>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Cài đặt Hệ thống</h1>
          <div className="admin-page-actions">
            <button className="btn btn-primary"><i className="bx bx-save"></i> Lưu cài đặt</button>
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card admin-form-card border border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="p-4 border-b border-white/10">
              <h4 className="font-bold text-white mb-0"><i className="bx bx-globe text-primary"></i> Thông tin website</h4>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-group mb-0">
                <label className="text-muted text-sm mb-1 block">Tên cửa hàng</label>
                <input type="text" className="form-control bg-dark border-white/10 text-white" defaultValue="Argaty Store" />
              </div>
              <div className="form-group mb-0">
                <label className="text-muted text-sm mb-1 block">Email liên hệ</label>
                <input type="email" className="form-control bg-dark border-white/10 text-white" defaultValue="contact@argaty.com" />
              </div>
              <div className="form-group mb-0">
                <label className="text-muted text-sm mb-1 block">Hotline</label>
                <input type="text" className="form-control bg-dark border-white/10 text-white" defaultValue="1900 1234" />
              </div>
              <div className="form-group mb-0">
                <label className="text-muted text-sm mb-1 block">Địa chỉ</label>
                <textarea className="form-control bg-dark border-white/10 text-white" rows="2" defaultValue="Tầng 5, Tòa nhà ABC, 123 Cầu Giấy, Hà Nội"></textarea>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="card admin-form-card border border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="p-4 border-b border-white/10">
                <h4 className="font-bold text-white mb-0"><i className="bx bx-cog text-primary"></i> Tùy chọn giao dịch</h4>
              </div>
              <div className="p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white">Cho phép thanh toán COD</span>
                  <div className="w-10 h-5 bg-primary/30 rounded-full relative">
                    <div className="w-5 h-5 bg-primary rounded-full absolute right-0"></div>
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white">Bảo trì hệ thống khách hàng</span>
                  <div className="w-10 h-5 bg-white/10 rounded-full relative">
                    <div className="w-5 h-5 bg-white/50 rounded-full absolute left-0"></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="card admin-form-card border border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="p-4 border-b border-white/10">
                <h4 className="font-bold text-white mb-0"><i className="bx bx-paint text-primary"></i> Giao diện</h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="form-group mb-0">
                  <label className="text-muted text-sm mb-1 block">Logo URL</label>
                  <input type="text" className="form-control bg-dark border-white/10 text-white" defaultValue="/images/logo.png" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  export default Settings;
  
