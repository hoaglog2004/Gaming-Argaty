import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../../services/apiServices";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const data = await notificationApi.list();
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const list = await fetchNotifications();
        if (isMounted) setNotifications(list);
      } catch {
        if (isMounted) setNotifications([]);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // no-op
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // no-op
    }
  };

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.isRead),
    [notifications],
  );

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Thông báo</h2>
        {hasUnread && (
          <button className="btn btn-ghost btn-sm" onClick={markAllAsRead}>
            <i className="bx bx-check-double"></i> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item card p-4 mb-3 ${!notif.isRead ? "unread" : ""}`}
            >
              <div className="d-flex gap-4">
                <div
                  className="notification-icon"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "rgba(139, 92, 246, 0.15)",
                  }}
                >
                  <i
                    className={`bx ${notif.typeIcon || "bx-bell"}`}
                    style={{ fontSize: "24px", color: "#fff" }}
                  ></i>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-between align-center mb-1">
                    <h4 className="mb-0" style={{ fontSize: "15px" }}>
                      {notif.title}
                    </h4>
                    <span className="text-muted" style={{ fontSize: "12px" }}>
                      {notif.timeAgo ||
                        new Date(notif.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  <p className="text-secondary mb-2">{notif.message}</p>

                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="text-cyan"
                      style={{ fontSize: "13px" }}
                    >
                      Xem chi tiết <i className="bx bx-right-arrow-alt"></i>
                    </Link>
                  )}
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Đánh dấu đã đọc"
                  >
                    <i className="bx bx-check"></i>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="bx bx-bell-off"></i>
            </div>
            <h3 className="empty-state__title">Không có thông báo</h3>
            <p className="empty-state__desc">
              Bạn sẽ nhận được thông báo khi có cập nhật mới về đơn hàng, khuyến
              mãi...
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;
