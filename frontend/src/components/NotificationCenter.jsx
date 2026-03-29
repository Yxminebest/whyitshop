import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // 📥 Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (error) {
        console.error("Fetch notifications error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // 🔄 Real-time subscription (Supabase v2 API)
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications(prev => [newNotif, ...prev].slice(0, 5));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // ✅ Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  // 🗑️ Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  // 🔄 Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 🔔 Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          padding: "8px 12px",
          transition: "0.2s",
          color: unreadCount > 0 ? "#667eea" : "var(--text-muted)"
        }}
        onMouseEnter={(e) => e.target.style.color = "#667eea"}
        onMouseLeave={(e) => e.target.style.color = unreadCount > 0 ? "#667eea" : "var(--text-muted)"}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 📬 Dropdown Panel */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "10px",
            width: "350px",
            maxHeight: "400px",
            background: "var(--bg-main)",
            border: "1px solid var(--card-border)",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "15px",
              borderBottom: "1px solid var(--card-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px" }}>🔔 Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#667eea",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textDecoration: "underline"
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              maxHeight: "300px"
            }}
          >
            {loading ? (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                No notifications yet
              </p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid var(--card-border)",
                    background: notif.is_read ? "transparent" : "rgba(102, 126, 234, 0.05)",
                    cursor: "pointer",
                    transition: "0.2s",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.is_read ? "transparent" : "rgba(102, 126, 234, 0.05)"}
                >
                  {/* Icon */}
                  <span style={{ fontSize: "20px", minWidth: "30px", textAlign: "center" }}>
                    {notif.icon}
                  </span>

                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
                      onClick: () => {
                        if (notif.action_url) {
                          window.location.href = notif.action_url;
                        }
                        if (!notif.is_read) {
                          markAsRead(notif.id);
                        }
                      }
                    }}
                  >
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>
                      {notif.title}
                      {!notif.is_read && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            background: "#667eea",
                            borderRadius: "50%",
                            marginLeft: "8px",
                            verticalAlign: "middle"
                          }}
                        />
                      )}
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(notif.created_at).toLocaleTimeString('th-TH')}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--danger)",
                      fontSize: "16px",
                      padding: "0",
                      minWidth: "24px"
                    }}
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                borderTop: "1px solid var(--card-border)",
                background: "var(--bg-secondary)"
              }}
            >
              <a
                href="/notifications"
                style={{
                  color: "#667eea",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "bold"
                }}
              >
                View All Notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
