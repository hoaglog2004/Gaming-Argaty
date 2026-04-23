import React, { useState } from 'react';

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      category: 'order',
      question: 'Làm sao để đặt hàng tại Argaty?',
      answer: (
        <>
          <p className="text-secondary">Bạn có thể đặt hàng theo các bước sau:</p>
          <ol className="text-secondary" style={{ paddingLeft: '20px' }}>
            <li>Chọn sản phẩm và thêm vào giỏ hàng</li>
            <li>Vào giỏ hàng và nhấn "Thanh toán"</li>
            <li>Điền thông tin giao hàng và chọn phương thức thanh toán</li>
            <li>Xác nhận đơn hàng</li>
          </ol>
        </>
      )
    },
    {
      id: 2,
      category: 'shipping',
      question: 'Thời gian giao hàng là bao lâu?',
      answer: (
        <>
          <p className="text-secondary">
            <strong>Nội thành HCM, Hà Nội: </strong> 1-2 ngày<br />
            <strong>Các tỉnh thành khác:</strong> 3-5 ngày<br />
            <strong>Vùng sâu, vùng xa:</strong> 5-7 ngày
          </p>
          <p className="text-muted">
            Lưu ý: Thời gian có thể thay đổi tùy thuộc vào đơn vị vận chuyển và điều kiện thời tiết.
          </p>
        </>
      )
    },
    {
      id: 3,
      category: 'shipping',
      question: 'Phí vận chuyển là bao nhiêu?',
      answer: (
        <p className="text-secondary">
          Phí vận chuyển mặc định là <strong className="text-cyan">30,000 ₫</strong>. <br />
          <strong className="text-success">Miễn phí ship</strong> cho đơn hàng từ <strong>500,000 ₫</strong> trở lên.
        </p>
      )
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    // Filter by category
    if (activeCategory !== 'all' && faq.category !== activeCategory) return false;
    // Filter by search query
    if (searchQuery && !faq.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="faq-page section" style={{ padding: '120px 0 80px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-5">
          <h1 className="section-title text-gradient">Câu hỏi thường gặp</h1>
          <p className="section-subtitle">
            Tìm câu trả lời cho những thắc mắc phổ biến
          </p>
        </div>

        {/* Search */}
        <div className="card glass p-4 mb-5">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-primary" style={{ padding: '0 20px', borderRadius: '0 8px 8px 0' }}>
              <i className="bx bx-search"></i>
            </button>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="faq-categories mb-4 flex gap-2">
          <button 
            className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-dark'}`}
            onClick={() => setActiveCategory('all')}
          >
            Tất cả
          </button>
          <button 
            className={`btn ${activeCategory === 'order' ? 'btn-primary' : 'btn-dark'}`}
            onClick={() => setActiveCategory('order')}
          >
            Đặt hàng
          </button>
          <button 
            className={`btn ${activeCategory === 'shipping' ? 'btn-primary' : 'btn-dark'}`}
            onClick={() => setActiveCategory('shipping')}
          >
            Vận chuyển
          </button>
          <button 
            className={`btn ${activeCategory === 'payment' ? 'btn-primary' : 'btn-dark'}`}
            onClick={() => setActiveCategory('payment')}
          >
            Thanh toán
          </button>
          <button 
            className={`btn ${activeCategory === 'warranty' ? 'btn-primary' : 'btn-dark'}`}
            onClick={() => setActiveCategory('warranty')}
          >
            Bảo hành
          </button>
        </div>

        {/* FAQ List */}
        <div className="faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="faq-item card glass mb-3">
                <div 
                  className="faq-question p-4 cursor-pointer" 
                  onClick={() => toggleFaq(faq.id)}
                >
                  <h4 className="mb-0 flex justify-between items-center text-lg font-medium">
                    <span>{faq.question}</span>
                    <i className={`bx bx-chevron-down transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`}></i>
                  </h4>
                </div>
                {openFaq === faq.id && (
                  <div className="faq-answer p-4 pt-0 border-t border-gray-700/30 mt-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-5 card glass">
              <i className="bx bx-file-blank text-4xl text-muted mb-3"></i>
              <p className="text-secondary">Không tìm thấy câu hỏi phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
