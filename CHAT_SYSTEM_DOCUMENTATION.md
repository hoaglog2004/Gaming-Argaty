# ARGATY Chat Widget - Documentation

## Tổng quan

Hệ thống chat real-time cho phép khách hàng chat trực tiếp với admin. Khi có nhiều người chat cùng lúc, hệ thống sẽ tạo hàng đợi với vị trí xếp hàng rõ ràng.

## 🎯 Tính năng

✅ **Chat Widget Floating** - Icon chat ở góc trái màn hình  
✅ **Queue Management** - Hàng đợi tự động với vị trí xếp hàng  
✅ **Real-time Status** - Cập nhật trạng thái theo thời gian thực  
✅ **Message History** - Lưu trữ lịch sử chat  
✅ **Session Persistence** - Tiếp tục chat sau khi reload page  
✅ **Admin Dashboard** - Quản lý chat từ admin panel  
✅ **Responsive Design** - Hoạt động tốt trên mobile  

---

## 🏗️ Backend Architecture

### Entities

#### `ChatSession` (chat_sessions table)
```java
- id: Long (Primary Key)
- sessionId: String (Unique - UUID)
- visitorName: String
- visitorEmail: String
- visitorPhone: String
- status: String (waiting, connected, closed)
- assignedAdminId: Long (nullable)
- assignedAdminName: String (nullable)
- queuePosition: Integer
- messageCount: Integer
- createdAt: LocalDateTime
- updatedAt: LocalDateTime
- connectedAt: LocalDateTime (nullable)
- closedAt: LocalDateTime (nullable)
- closeReason: String (nullable)
```

#### `ChatMessage` (chat_messages table)
```java
- id: Long (Primary Key)
- visitorId: String (Foreign Key to ChatSession.sessionId)
- visitorName: String
- visitorEmail: String
- message: String (TEXT)
- sender: String (visitor, admin)
- adminId: Long (nullable)
- adminName: String (nullable)
- status: String (sent, delivered, read)
- isRead: Boolean
- conversationStatus: String
- createdAt: LocalDateTime
- readAt: LocalDateTime (nullable)
```

### Services

#### `ChatService`
Quản lý tất cả logic chat:
- `startChat()` - Tạo phiên chat mới
- `sendMessage()` - Gửi tin nhắn
- `getConversation()` - Lấy lịch sử chat
- `assignChatToAdmin()` - Gán chat cho admin
- `closeChat()` - Đóng phiên chat
- `getWaitingQueueCount()` - Lấy số người chờ
- `getWaitingQueue()` - Lấy danh sách hàng đợi
- `updateQueuePositions()` - Cập nhật vị trí xếp hàng

---

## 🔌 API Endpoints

### Client APIs (`/api/chat`)

#### 1. Bắt đầu chat
```http
POST /api/chat/start
Content-Type: application/json

{
  "visitorName": "Tên khách hàng",
  "visitorEmail": "email@example.com",
  "visitorPhone": "0912345678"
}

Response:
{
  "status": "success",
  "message": "Chat session started",
  "data": {
    "id": 1,
    "sessionId": "uuid-string",
    "visitorName": "Tên khách hàng",
    "status": "waiting",
    "queuePosition": 2,
    "waitingCount": 5,
    "createdAt": "2026-04-21T10:30:00"
  }
}
```

#### 2. Gửi tin nhắn
```http
POST /api/chat/{sessionId}/send
Content-Type: application/json

{
  "message": "Nội dung tin nhắn",
  "sender": "visitor"
}

Response:
{
  "status": "success",
  "message": "Message sent",
  "data": {
    "id": 1,
    "visitorName": "Tên khách hàng",
    "message": "Nội dung tin nhắn",
    "sender": "visitor",
    "createdAt": "2026-04-21T10:30:00",
    "status": "sent"
  }
}
```

#### 3. Lấy lịch sử chat
```http
GET /api/chat/{sessionId}/messages

Response:
{
  "status": "success",
  "message": "Conversation retrieved",
  "data": [
    {
      "id": 1,
      "visitorName": "Khách hàng",
      "message": "Xin chào",
      "sender": "visitor",
      "createdAt": "2026-04-21T10:30:00"
    },
    {
      "id": 2,
      "visitorName": "Khách hàng",
      "message": "Admin đã kết nối",
      "sender": "admin",
      "adminName": "Support Team",
      "createdAt": "2026-04-21T10:31:00"
    }
  ]
}
```

#### 4. Lấy thông tin phiên chat
```http
GET /api/chat/{sessionId}

Response:
{
  "status": "success",
  "message": "Chat session retrieved",
  "data": {
    "sessionId": "uuid-string",
    "visitorName": "Tên khách hàng",
    "status": "waiting",
    "queuePosition": 2,
    "waitingCount": 5,
    "messageCount": 3
  }
}
```

#### 5. Lấy số lượng hàng đợi
```http
GET /api/chat/queue/count

Response:
{
  "status": "success",
  "message": "Queue count retrieved",
  "data": {
    "waitingCount": 5
  }
}
```

#### 6. Đóng chat
```http
POST /api/chat/{sessionId}/close?reason=User%20closed%20chat

Response:
{
  "status": "success",
  "message": "Chat closed"
}
```

---

### Admin APIs (`/api/admin/chat`)

#### 1. Lấy hàng đợi chờ
```http
GET /api/admin/chat/queue

Response:
{
  "status": "success",
  "data": [
    {
      "sessionId": "uuid-1",
      "visitorName": "Khách hàng 1",
      "queuePosition": 1,
      "createdAt": "2026-04-21T10:30:00"
    },
    {
      "sessionId": "uuid-2",
      "visitorName": "Khách hàng 2",
      "queuePosition": 2,
      "createdAt": "2026-04-21T10:31:00"
    }
  ]
}
```

#### 2. Gán chat cho admin
```http
POST /api/admin/chat/{sessionId}/assign
Content-Type: application/json

{
  "adminId": "123",
  "adminName": "Tên Admin"
}

Response:
{
  "status": "success",
  "message": "Chat assigned to admin",
  "data": {
    "sessionId": "uuid-string",
    "status": "connected",
    "assignedAdminName": "Tên Admin",
    "connectedAt": "2026-04-21T10:32:00"
  }
}
```

#### 3. Lấy danh sách chat của admin
```http
GET /api/admin/chat/my-chats/{adminId}

Response:
{
  "status": "success",
  "data": [
    {
      "sessionId": "uuid-1",
      "visitorName": "Khách hàng 1",
      "status": "connected",
      "messageCount": 5
    }
  ]
}
```

#### 4. Admin gửi tin nhắn
```http
POST /api/admin/chat/{sessionId}/send
Content-Type: application/json

{
  "message": "Cảm ơn bạn đã liên hệ"
}
```

---

## 🎨 Frontend Component

### ChatWidget Component

#### Location
```
FE/src/components/ChatWidget.jsx
FE/src/components/ChatWidget.css
```

#### Features
- **Floating Icon** - Ở góc trái màn hình, có badge hiển thị số người chờ
- **Modal Window** - Hiện khung chat khi click icon
- **Init Form** - Form điền tên/email khi bắt đầu
- **Messages Area** - Hiển thị tin nhắn với timestamp
- **Queue Status** - Hiển thị vị trí xếp hàng (ví dụ: "Vị trí: 2/5")
- **Input Form** - Nhập tin nhắn và gửi
- **Real-time Polling** - Cập nhật trạng thái mỗi 3 giây

#### State Management
```javascript
const [isOpen, setIsOpen] = useState(false);           // Chat window mở/đóng
const [sessionId, setSessionId] = useState(null);     // Session ID
const [chatStatus, setChatStatus] = useState("closed"); // closed, waiting, connected
const [messages, setMessages] = useState([]);         // Danh sách tin nhắn
const [queuePosition, setQueuePosition] = useState(0); // Vị trí hàng đợi
const [waitingCount, setWaitingCount] = useState(0);  // Tổng số người chờ
```

#### localStorage Usage
```javascript
// Lưu sessionId để tiếp tục chat sau khi reload
localStorage.setItem("chatSessionId", sessionId);
localStorage.setItem("chatVisitorName", visitorName);

// Lấy khi load
const savedSessionId = localStorage.getItem("chatSessionId");
```

---

## 📱 UI/UX Design

### Chat Button
- **Position**: Fixed ở góc trái dưới (`bottom: 20px; left: 20px`)
- **Shape**: Hình tròn 60x60px
- **Color**: Gradient từ primary đến accent
- **Icon**: `bx bx-message-dots`
- **Badge**: Hiển thị số người chờ (màu đỏ)

### Chat Window
- **Size**: 380px × 600px (responsive)
- **Header**: Gradient header với tiêu đề + nút đóng
- **Messages Area**: Cuộn được, messages khác nhau cho visitor/admin
- **Input Area**: Input + send button

### Status Messages
- **Waiting**: "Bạn đang chờ (Vị trí: X/Y)" - Badge màu vàng
- **Connected**: "Admin đã kết nối" - Badge màu xanh
- **Empty**: "Hãy bắt đầu cuộc trò chuyện"

---

## 🔄 Chat Flow

### Khách hàng
1. Click icon chat → Mở form
2. Nhập tên + email → Gửi
3. Hệ thống tạo session → Hiển thị "Đang chờ (Vị trí: X/Y)"
4. Admin gán chat → Trạng thái chuyển "connected"
5. Chat với admin → Tin nhắn thời gian thực
6. Close chat → Clear localStorage

### Admin
1. Xem hàng đợi → `/api/admin/chat/queue`
2. Click chat → Gán cho mình → `/api/admin/chat/{sessionId}/assign`
3. Gửi tin nhắn → `/api/admin/chat/{sessionId}/send`
4. Close chat → `/api/chat/{sessionId}/close`

---

## 🚀 Deployment

### Database
Tự động tạo table qua Hibernate (ddl-auto=update):
```sql
-- Tables sẽ được tạo tự động
chat_sessions
chat_messages
```

### Environment Variables
Không cần thêm biến môi trường, sử dụng default config

### Backend Start
```bash
cd /path/to/argaty
./mvnw.cmd spring-boot:run
```

### Frontend Start
```bash
cd FE
npm run dev
```

---

## 📊 Database Queries

### Lấy danh sách hàng đợi
```sql
SELECT * FROM chat_sessions 
WHERE status = 'waiting' 
ORDER BY created_at ASC
```

### Lấy chat của admin
```sql
SELECT * FROM chat_sessions 
WHERE assigned_admin_id = ? AND status = 'connected'
```

### Lấy tin nhắn chưa đọc
```sql
SELECT * FROM chat_messages 
WHERE is_read = false AND admin_id = ?
```

---

## ⚙️ Configuration

### Polling Interval
```javascript
// ChatWidget.jsx - Mỗi 3 giây kiểm tra trạng thái
setInterval(async () => {
  const response = await apiClient.get(`/api/chat/${sessionId}`);
  // Update status
}, 3000);
```

Để thay đổi, sửa giá trị trong `ChatWidget.jsx`:
```javascript
}, 3000); // Thay 3000 bằng giá trị khác (ms)
```

### Message Limit
Lấy tối đa 50 tin nhắn mới nhất:
```java
// ChatMessageRepository.java
@Query("SELECT m FROM ChatMessage m WHERE m.visitorId = :visitorId ORDER BY m.createdAt DESC LIMIT :limit")
```

---

## 🐛 Troubleshooting

### Chat không kết nối
- Kiểm tra backend server đang chạy (port 8080)
- Kiểm tra CORS trong backend

### Không lưu sessionId
- Kiểm tra localStorage có bị disable không
- Check browser console cho lỗi

### Queue position không update
- Kiểm tra polling interval (mặc định 3s)
- Xem console có lỗi API không

### Admin không nhận tin nhắn
- Kiểm tra `assignedAdminId` có được set không
- Xem database có lưu message không

---

## 🔐 Security Notes

- **Authentication**: API `/api/admin/chat` yêu cầu role ADMIN
- **Validation**: Tất cả input được validate trước save
- **Message**: Không sanitize HTML (có thể add nếu cần)
- **Session**: SessionId là UUID, khó đoán

---

## 📈 Future Enhancements

- WebSocket cho real-time thay vì polling
- File upload trong chat
- Chat templates/canned responses
- Chat transcript export
- Rating/feedback after chat
- Chat analytics/metrics
- Multiple language support
- Typing indicator
- Read receipts

---

Tạo ngày: **2026-04-21**  
Phiên bản: **1.0**  
Author: **ARGATY Development Team**
