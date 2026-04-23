import { useEffect, useRef, useState } from "react";
import { adminApi } from "../../../services/apiServices";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import "./Chats.css";

const POLL_INTERVAL_MS = 3000;
const MESSAGE_POLL_INTERVAL_MS = 2000;

const AdminChatsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [queueSessions, setQueueSessions] = useState([]);
  const [openSessions, setOpenSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const adminId = user?.id;
  const adminName = user?.fullName || user?.email || "Admin";

  const loadQueueSessions = async () => {
    try {
      const response = await adminApi.chat.queue();
      setQueueSessions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load chat queue:", error);
    }
  };

  const loadOpenSessions = async () => {
    try {
      const sessions = await adminApi.chat.sessions();
      const normalizedSessions = Array.isArray(sessions) ? sessions : [];
      setOpenSessions(normalizedSessions);

      if (!selectedSessionId && normalizedSessions.length > 0) {
        setSelectedSessionId(normalizedSessions[0].sessionId);
      }
    } catch (error) {
      console.error("Failed to load open sessions:", error);
    }
  };

  const loadSelectedSession = async (sessionId) => {
    if (!sessionId) return;

    try {
      const [session, messagesData] = await Promise.all([
        adminApi.chat.detail(sessionId),
        adminApi.chat.messages(sessionId),
      ]);

      setSelectedSession(session);
      setMessages(messagesData || []);
    } catch (error) {
      console.error(`Failed to load chat session ${sessionId}:`, error);
      setMessages([]);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadQueueSessions(), loadOpenSessions()]);

    if (selectedSessionId) {
      await loadSelectedSession(selectedSessionId);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      setSelectedSession(null);
      setMessages([]);
      return;
    }

    loadSelectedSession(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!chatContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    
    const container = chatContainerRef.current;
    // Check if scroll is near bottom (within 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
    
    // If we're at the bottom, or it's the first time loading messages, scroll down
    if (isNearBottom || messages.length <= 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const sessionTimer = setInterval(() => {
      loadQueueSessions();
      loadOpenSessions();

      if (selectedSessionId) {
        loadSelectedSession(selectedSessionId);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(sessionTimer);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return;

    const messageTimer = setInterval(() => {
      loadSelectedSession(selectedSessionId);
    }, MESSAGE_POLL_INTERVAL_MS);

    return () => clearInterval(messageTimer);
  }, [selectedSessionId]);

  const handleAssignChat = async () => {
    if (!selectedSessionId || !adminId) return;

    setAssigning(true);
    try {
      await adminApi.chat.assign(selectedSessionId, {
        adminId: String(adminId),
        adminName,
      });
      await refreshAll();
      showToast("success", "Đã nhận chat", "Phiên chat đã được gán cho bạn");
    } catch (error) {
      console.error("Failed to assign chat:", error);
      showToast("error", "Lỗi", "Không thể nhận phiên chat này");
    } finally {
      setAssigning(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedSessionId) return;

    setLoading(true);
    try {
      await adminApi.chat.send(selectedSessionId, {
        message: messageText,
      });

      setMessageText("");
      await loadSelectedSession(selectedSessionId);
      await Promise.all([loadQueueSessions(), loadOpenSessions()]);
    } catch (error) {
      console.error("Failed to send admin message:", error);
      showToast("error", "Lỗi", "Không thể gửi tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const waitingSessions = queueSessions;
  const activeSessions = openSessions.filter((session) => session.status === "connected");

  const selectedSessionFromLists =
    openSessions.find((session) => session.sessionId === selectedSessionId) ||
    queueSessions.find((session) => session.sessionId === selectedSessionId);

  const currentSession = selectedSession || selectedSessionFromLists;
  const currentStatus = currentSession?.status || "closed";

  return (
    <div className="admin-chats-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Chat hỗ trợ khách hàng</h1>
        <p className="text-muted">Quản lý queue, nhận chat và trả lời khách hàng theo thời gian thực</p>
      </div>

      <div className="chats-container">
        <div className="sessions-panel">
          <div className="panel-header">
            <h3>Đang chờ ({waitingSessions.length})</h3>
          </div>

          <div className="sessions-list">
            {waitingSessions.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted">Chưa có khách nào trong hàng đợi</p>
              </div>
            ) : (
              waitingSessions.map((session) => (
                <button
                  key={session.sessionId}
                  type="button"
                  className={`session-item ${selectedSessionId === session.sessionId ? "active" : ""}`}
                  onClick={() => setSelectedSessionId(session.sessionId)}
                >
                  <div className="session-info">
                    <div className="session-name">{session.visitorName}</div>
                    <div className="session-email">{session.visitorEmail || "Không có email"}</div>
                  </div>
                  <div className={`status-badge status-${session.status}`}>Chờ</div>
                </button>
              ))
            )}
          </div>

          <div className="panel-header">
            <h3>Đang hoạt động ({activeSessions.length})</h3>
          </div>

          <div className="sessions-list">
            {activeSessions.length === 0 ? (
              <div className="empty-state">
                <p className="text-muted">Chưa có phiên đang kết nối</p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <button
                  key={session.sessionId}
                  type="button"
                  className={`session-item ${selectedSessionId === session.sessionId ? "active" : ""}`}
                  onClick={() => setSelectedSessionId(session.sessionId)}
                >
                  <div className="session-info">
                    <div className="session-name">{session.visitorName}</div>
                    <div className="session-email">{session.assignedAdminName || session.visitorEmail || "Không có email"}</div>
                  </div>
                  <div className={`status-badge status-${session.status}`}>Đang chat</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="chat-panel">
          {!currentSession ? (
            <div className="empty-state">
              <p className="text-muted">Chọn một phiên chat để xem nội dung</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div>
                  <h4>{currentSession.visitorName}</h4>
                  <p className="text-muted">{currentSession.visitorEmail || currentSession.visitorPhone || "Khách ẩn danh"}</p>
                  {currentSession.assignedAdminName && (
                    <p className="text-muted">Đang xử lý bởi: {currentSession.assignedAdminName}</p>
                  )}
                </div>

                <div className="chat-header-actions">
                  <span className={`status-badge status-${currentStatus}`}>
                    {currentStatus === "waiting" ? "Đang chờ" : currentStatus === "connected" ? "Đang chat" : "Đã đóng"}
                  </span>

                  {currentStatus === "waiting" && (
                    <div title={!adminId ? "Đang tải dữ liệu tài khoản..." : ""} style={{ display: "inline-block" }}>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleAssignChat}
                        disabled={assigning || !adminId}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        {assigning ? <><i className="bx bx-loader-alt bx-spin"></i> Đang nhận...</> : "Nhận chat"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="messages-area" ref={chatContainerRef}>
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p className="text-muted">Chưa có tin nhắn</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.sender === "admin" ? "admin" : "visitor"}`}
                    >
                      <div className="message-sender">
                        {msg.sender === "admin" ? msg.adminName || "Admin" : msg.visitorName}
                      </div>
                      <div className="message-content">{msg.message}</div>
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="form-control"
                  disabled={loading || currentStatus === "closed"}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !messageText.trim() || currentStatus === "closed"}
                >
                  <i className="bx bx-send"></i> Gửi
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatsPage;