import React from 'react';
import { useSearchParams } from 'react-router-dom';

const Policy = () => {
  const [searchParams] = useSearchParams();
  // Get policy type from URL if any, e.g., /policy?type=đổi-trả
  const policyType = searchParams.get('type') || 'chung';

  let title = 'Chính sách';
  let content = 'Trang chính sách hiện chưa có nội dung chi tiết. Bạn có thể bổ sung nội dung theo từng loại chính sách (ví dụ: đổi trả, bảo hành, vận chuyển, thanh toán).';

  if (policyType === 'doi-tra') {
     title = 'Chính sách đổi trả';
     content = 'Thông tin chính sách đổi trả hàng hóa...';
  } else if (policyType === 'bao-hanh') {
     title = 'Chính sách bảo hành';
     content = 'Thông tin chính sách bảo hành...';
  }

  return (
    <div className="policy-page section" style={{ padding: '120px 0 80px' }}>
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="section-title text-gradient">{title}</h1>
          <p className="section-subtitle">
            Thông tin chi tiết quy định và điều khoản
          </p>
        </div>

        <div className="card glass p-5 max-w-4xl mx-auto">
          <p className="text-secondary" style={{ lineHeight: 1.9 }}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Policy;
