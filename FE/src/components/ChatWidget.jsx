import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { chatApi } from "../services/apiServices";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import "./ChatWidget.css";

const CHAT_SESSION_KEY = "chatSessionId";
const CHAT_EMAIL_KEY = "chatSessionEmail";
const CHAT_GUEST_NAME_KEY = "chatGuestName";
const CHAT_GUEST_EMAIL_KEY = "chatGuestEmail";
const CHAT_GUEST_PHONE_KEY = "chatGuestPhone";

const ChatWidget = () => {
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatStatus, setChatStatus] = useState("closed");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [guestName, setGuestName] = useState(
    localStorage.getItem(CHAT_GUEST_NAME_KEY) || "",
  );
  const [guestEmail, setGuestEmail] = useState(
    localStorage.getItem(CHAT_GUEST_EMAIL_KEY) || "",
  );
  const [guestPhone, setGuestPhone] = useState(
    localStorage.getItem(CHAT_GUEST_PHONE_KEY) || "",
  );
  const [loading, setLoading] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const resetChatState = () => {
    setSessionId(null);
    setChatStatus("closed");
    setMessages([]);
    setInputMessage("");
    setQueuePosition(0);
    setWaitingCount(0);
  };

  const loadConversation = async (sid) => {
    const [session, messagesData] = await Promise.all([
      chatApi.getSession(sid),
      chatApi.getMessages(sid),
    ]);

    if (session) {
      setSessionId(session.sessionId);
      setChatStatus(session.status);
      setQueuePosition(session.queuePosition || 0);
      setWaitingCount(session.waitingCount || 0);
    }

    setMessages(Array.isArray(messagesData) ? messagesData : []);
  };

  const startAuthenticatedChat = async () => {
    setLoading(true);
    try {
      const session = await chatApi.startAuth();
      if (!session?.sessionId) {
        throw new Error("Không thể khởi tạo phiên chat");
      }

      localStorage.setItem(CHAT_SESSION_KEY, session.sessionId);
      if (user?.email) {
        localStorage.setItem(CHAT_EMAIL_KEY, user.email);
      }

      await loadConversation(session.sessionId);
    } catch (error) {
      showToast(
        "error",
        "Không thể bắt đầu chat",
        error?.response?.data?.message || "Vui lòng thử lại sau",
      );
    } finally {
      setLoading(false);
    }
  };

  const startGuestChat = async () => {
    const visitorName = guestName.trim();
    if (!visitorName) {
      showToast("warning", "Thiếu thông tin", "Vui lòng nhập tên của bạn");
      return;
    }

    setLoading(true);
    try {
      const session = await chatApi.startGuest({
        visitorName,
        visitorEmail: guestEmail.trim() || null,
        visitorPhone: guestPhone.trim() || null,
      });

      if (!session?.sessionId) {
        throw new Error("Không thể khởi tạo phiên chat");
      }

      localStorage.setItem(CHAT_SESSION_KEY, session.sessionId);
      localStorage.removeItem(CHAT_EMAIL_KEY);
      localStorage.setItem(CHAT_GUEST_NAME_KEY, visitorName);
      localStorage.setItem(CHAT_GUEST_EMAIL_KEY, guestEmail.trim());
      localStorage.setItem(CHAT_GUEST_PHONE_KEY, guestPhone.trim());

      await loadConversation(session.sessionId);
    } catch (error) {
      showToast(
        "error",
        "Không thể bắt đầu chat",
        error?.response?.data?.message || "Vui lòng thử lại sau",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSessionId = localStorage.getItem(CHAT_SESSION_KEY);
    const savedEmail = localStorage.getItem(CHAT_EMAIL_KEY);

    if (!savedSessionId) {
      if (isAuthenticated && user?.email) {
        localStorage.setItem(CHAT_EMAIL_KEY, user.email);
      }
      return;
    }

    if (isAuthenticated && user?.email && savedEmail && savedEmail !== user.email) {
      localStorage.removeItem(CHAT_SESSION_KEY);
      resetChatState();
      return;
    }

    loadConversation(savedSessionId).catch(() => {
      localStorage.removeItem(CHAT_SESSION_KEY);
      resetChatState();
    });
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        await loadConversation(sessionId);
      } catch {
        // Silent polling fail
      }
    }, 3000);

    return () => clearInterval(pollIntervalRef.current);
  }, [sessionId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId) return;

    setLoading(true);
    try {
      await chatApi.send(sessionId, {
        message: inputMessage,
        sender: "visitor",
      });
      setInputMessage("");
      await loadConversation(sessionId);
    } catch {
      showToast("error", "Lỗi", "Không thể gửi tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseChat = async () => {
    if (!sessionId) {
      setIsOpen(false);
      return;
    }

    try {
      await chatApi.close(sessionId, "User closed chat");
    } finally {
      localStorage.removeItem(CHAT_SESSION_KEY);
      resetChatState();
      setIsOpen(false);
      clearInterval(pollIntervalRef.current);
    }
  };

  const subtitle = !isAuthenticated
    ? "Bạn có thể chat ngay với tư cách khách"
    : !sessionId
      ? "Bắt đầu cuộc trò chuyện"
      : chatStatus === "waiting" && queuePosition > 0
        ? `Bạn đang chờ (Vị trí: ${queuePosition}/${waitingCount}) - có thể nhắn tin trước`
        : chatStatus === "connected"
          ? "Admin đang trực tuyến"
          : "Bạn có thể nhắn tin ngay";

  if (user?.canAccessAdmin) {
    return null;
  }

  return (
    <div className="chat-widget">
      {!isOpen && (
        <button
          className="chat-widget__button"
          onClick={() => setIsOpen(true)}
          title="Mở chat"
        >
          <i className="bx bx-message-dots"></i>
          <span className="chat-widget__button-text">Chat</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-widget__window">
          <div className="chat-widget__header">
            <div className="chat-widget__header-content">
              <h3 className="chat-widget__title">
                <i className="bx bx-chat"></i> Hỗ Trợ Trực Tuyến
              </h3>
              <p className="chat-widget__subtitle">{subtitle}</p>
            </div>
            <button
              className="chat-widget__close-btn"
              onClick={handleCloseChat}
              title="Đóng"
            >
              <i className="bx bx-x"></i>
            </button>
          </div>

          <div className="chat-widget__messages">
            {!sessionId ? (
              <div className="chat-widget__init-form">
                <div className="chat-widget__welcome">
                  <i className="bx bx-happy-beaming"></i>
                  <h4>
                    {isAuthenticated
                      ? `Xin chào, ${user?.fullName || "bạn"}!`
                      : "Xin chào!"}
                  </h4>
                  <p>Bắt đầu trò chuyện để nhận hỗ trợ từ admin</p>
                </div>

                {!isAuthenticated && (
                  <>
                    <input
                      type="text"
                      className="chat-widget__input"
                      placeholder="Tên của bạn *"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      style={{ marginBottom: "8px" }}
                    />
                    <input
                      type="email"
                      className="chat-widget__input"
                      placeholder="Email (không bắt buộc)"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      style={{ marginBottom: "8px" }}
                    />
                    <input
                      type="tel"
                      className="chat-widget__input"
                      placeholder="Số điện thoại (không bắt buộc)"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      style={{ marginBottom: "12px" }}
                    />
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={isAuthenticated ? startAuthenticatedChat : startGuestChat}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Đang khởi tạo...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-chat"></i> Bắt đầu Chat
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <p style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
                    Hoặc <Link to="/auth/login">đăng nhập</Link> để đồng bộ lịch sử chat với tài khoản.
                  </p>
                )}
              </div>
            ) : (
              <>
                {chatStatus === "waiting" && (
                  <div className="chat-widget__status-message">
                    <i className="bx bx-time-five"></i>
                    <p>
                      Bạn đang chờ (vị trí: <strong>{queuePosition}</strong> / {waitingCount}). Bạn có thể gửi trước, admin sẽ phản hồi khi nhận phiên.
                    </p>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="chat-widget__empty">
                    <i className="bx bx-chat"></i>
                    <p>Hãy bắt đầu cuộc trò chuyện</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-widget__message ${
                        msg.sender === "visitor"
                          ? "chat-widget__message--visitor"
                          : "chat-widget__message--admin"
                      }`}
                    >
                      <div className="chat-widget__message-content">
                        <strong className="chat-widget__message-sender">
                          {msg.sender === "admin" ? msg.adminName : msg.visitorName}
                        </strong>
                        <p className="chat-widget__message-text">{msg.message}</p>
                        <small className="chat-widget__message-time">
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {sessionId && (
            <div className="chat-widget__input-wrapper">
              <form onSubmit={handleSendMessage} className="chat-widget__input-form">
                <input
                  type="text"
                  className="chat-widget__input"
                  placeholder="Nhập tin nhắn... (Nhấn Enter để gửi)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="chat-widget__send-btn"
                  disabled={!inputMessage.trim() || loading}
                  title="Gửi"
                >
                  <i className="bx bx-send"></i>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
