import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken } from "../utils/auth";
import "./Notifications.css";

const PAGE_SIZE = 10;

function buildPageItems(totalPages, page) {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const items = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push("ellipsis");
    items.push(sorted[i]);
  }
  return items;
}

/* ── Notification type meta ──────────────────────────────── */
const TYPE_META = {
  goal:               { icon: "🎯", label: "Goal" },
  badge:              { icon: "🏅", label: "Badge" },
  leaderboard:        { icon: "🏆", label: "Leaderboard" },
  emission:           { icon: "⚠️", label: "Emission" },
  purchase:           { icon: "🛒", label: "Purchase" },
  purchase_pending:   { icon: "⏳", label: "Pending payment" },
  system:             { icon: "🔔", label: "System" },
};

function normalizeNotification(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.type || "system").toLowerCase();
  let message = raw.message || raw.title || "";
  message = message.replace(/\[\[tx:\d+\]\]\s*/g, "").trim();
  // Legacy copy mentioned a notification button we no longer show
  message = message.replace(/\s+or tap the button in this notification\.?/gi, "").trim();
  return {
    id: raw.id,
    type,
    title: raw.title || "",
    message,
    timestamp: raw.timestamp || raw.createdAt || "",
    read: raw.read === true || raw.isRead === true,
  };
}

const FILTER_OPTIONS = [
  { key: "all",         label: "All" },
  { key: "unread",      label: "🔴 Unread" },
  { key: "goal",        label: "🎯 Goals" },
  { key: "badge",       label: "🏅 Badges" },
  { key: "leaderboard", label: "🏆 Leaderboard" },
  { key: "emission",    label: "⚠️ Emissions" },
  { key: "purchase",    label: "🛒 Purchases" },
];

/* ─────────────────────────────────────────────────────────
   NOTIFICATIONS COMPONENT
   ───────────────────────────────────────────────────────── */
function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all");
  const [page, setPage]                   = useState(1);

  // ── Fetch notifications ──
  useEffect(() => {
    const token = getStoredToken();
    if (!token) { navigate("/login"); return; }

    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API_BASE}/auth/me`, { headers })
      .then((meRes) => meRes.data?.id)
      .then((userId) => {
        if (!userId) throw new Error("User ID not found.");
        return axios.get(`${API_BASE}/notifications/user/${userId}`, { headers });
      })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setNotifications(data.map(normalizeNotification).filter(Boolean));
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  // ── Derived values ──
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        if (filter === "unread") return !n.read;
        if (filter === "all") return true;
        if (filter === "purchase") {
          return n.type === "purchase" || n.type === "purchase_pending";
        }
        return n.type === filter;
      }),
    [notifications, filter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, page]);

  const pageItems = useMemo(
    () => buildPageItems(totalPages, page),
    [totalPages, page]
  );

  // ── Time formatting ──
  const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  // ── Handlers ──
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
    // Try backend
    const token = localStorage.getItem("token");
    if (token) {
      axios.put(`${API_BASE}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const token = localStorage.getItem("token");
    if (token) {
      axios.put(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const token = localStorage.getItem("token");
    if (token) {
      axios.put(
        `${API_BASE}/notifications/${id}/hide`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});
    }
  };

  const clearAllRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  // ── Render ──
  return (
    <AppLayout>
      <div className="notifications-page">

        {/* Header */}
        <div className="notifications-header">
          <div className="notifications-title-wrap">
            <h1 className="notifications-title">🔔 Notifications</h1>
            <p className="notifications-subtitle">
              Stay updated on your goals, badges, rankings, and eco marketplace activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="notifications-badge-count">
              {unreadCount} unread
            </span>
          )}
        </div>

        {loading ? (
          <div className="notifications-loading">
            <div className="notifications-spinner" />
            <p>Loading notifications…</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="notifications-filters">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`notifications-filter-btn ${filter === opt.key ? "active" : ""}`}
                  onClick={() => setFilter(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notifications-filter-btn"
                  onClick={markAllAsRead}
                  style={{ marginLeft: "auto" }}
                >
                  ✓ Mark all read
                </button>
              )}
              {notifications.some((n) => n.read) && (
                <button
                  type="button"
                  className="notifications-clear-btn"
                  onClick={clearAllRead}
                >
                  🗑 Clear read
                </button>
              )}
            </div>

            {/* Notification list */}
            {filteredNotifications.length === 0 ? (
              <div className="notifications-empty">
                <span className="notifications-empty-icon">
                  {filter === "unread" ? "✅" : "🔔"}
                </span>
                <h3 className="notifications-empty-title">
                  {filter === "unread" ? "All caught up!" : "No notifications"}
                </h3>
                <p className="notifications-empty-desc">
                  {filter === "unread"
                    ? "You've read all your notifications."
                    : "No notifications match the current filter."}
                </p>
              </div>
            ) : (
              <div className="notifications-list">
                {paginatedNotifications.map((notif) => {
                  const meta = TYPE_META[notif.type] || TYPE_META.system;
                  return (
                    <div
                      key={notif.id}
                      className={`notification-card ${notif.read ? "read" : "unread"}`}
                    >
                      {!notif.read && <span className="notification-unread-dot" />}

                      <div className={`notification-icon-bubble ${notif.type}`}>
                        {meta.icon}
                      </div>

                      <div className="notification-body">
                        {notif.title && (
                          <p className="notification-title">{notif.title}</p>
                        )}
                        <p
                          className="notification-message"
                          dangerouslySetInnerHTML={{ __html: notif.message }}
                        />
                        <div className="notification-meta">
                          <span className="notification-time">
                            {timeAgo(notif.timestamp)}
                          </span>
                          <span className={`notification-type-badge ${notif.type}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      <div className="notification-actions">
                        {!notif.read && (
                          <button
                            type="button"
                            className="notification-mark-btn"
                            onClick={() => markAsRead(notif.id)}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          className="notification-dismiss-btn"
                          onClick={() => dismissNotification(notif.id)}
                          title="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && filteredNotifications.length > 0 && (
              <nav className="notifications-pagination" aria-label="Notification pages">
                <span className="notifications-pagination-range">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredNotifications.length)} of{" "}
                  {filteredNotifications.length}
                </span>
                {totalPages > 1 && (
                  <div className="notifications-pagination-controls">
                    <button
                      type="button"
                      className="notifications-pagination-nav"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <div className="notifications-pagination-pages">
                      {pageItems.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`e-${idx}`}
                            className="notifications-pagination-ellipsis"
                            aria-hidden
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            className={`notifications-pagination-page ${
                              page === item ? "active" : ""
                            }`}
                            onClick={() => setPage(item)}
                            aria-current={page === item ? "page" : undefined}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      className="notifications-pagination-nav"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Notifications;
