import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE, { API_ORIGIN } from "../config";
import { isAdminRole } from "../utils/auth";
import "./AdminDashboard.css";
import "./Notifications.css";

const ADMIN_GOAL_TIMEFRAMES = [
  { id: "8_days", label: "Next 8 days" },
  { id: "15_days", label: "Next 15 days" },
  { id: "30_days", label: "Next 30 days" },
];

const BADGE_ICON_OPTIONS = [
  { value: "🌱", label: "🌱 Seedling" },
  { value: "🏆", label: "🏆 Trophy" },
  { value: "✂️", label: "✂️ Scissors" },
  { value: "📅", label: "📅 Calendar" },
  { value: "☀️", label: "☀️ Sun" },
  { value: "🔥", label: "🔥 Fire" },
  { value: "📋", label: "📋 Clipboard" },
  { value: "📊", label: "📊 Chart" },
  { value: "🌳", label: "🌳 Tree" },
  { value: "🎯", label: "🎯 Target" },
  { value: "✅", label: "✅ Check" },
  { value: "💡", label: "💡 Bulb" },
  { value: "📆", label: "📆 Date" },
  { value: "👑", label: "👑 Crown" },
  { value: "🤝", label: "🤝 Handshake" },
  { value: "🍃", label: "🍃 Leaf" },
  { value: "🌍", label: "🌍 Globe" },
  { value: "🚆", label: "🚆 Train" },
  { value: "🥦", label: "🥦 Broccoli" },
];

const ALL_USERS_OPTION_ID = "__all_users__";

function formatAdminGoalDate(value) {
  if (value == null || value === "") return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatAdminGoalTimeframe(id) {
  if (id == null || id === "") return "—";
  const s = String(id).toLowerCase();
  const row = ADMIN_GOAL_TIMEFRAMES.find((t) => t.id === s);
  return row ? row.label : id;
}

function formatAdminGoalCategory(c) {
  if (c == null || c === "") return "—";
  const s = String(c).toLowerCase();
  if (s === "all") return "All";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function adminGoalPeriodLabel(start, end) {
  const a = formatAdminGoalDate(start);
  const b = formatAdminGoalDate(end);
  if (a === "—" && b === "—") return "—";
  if (a === "—") return b;
  if (b === "—") return a;
  return `${a} – ${b}`;
}

function parseAdminGoalProgress(progress, isCompleted) {
  if (typeof progress === "number" && Number.isFinite(progress)) return progress;
  if (typeof progress === "string" && progress.trim() !== "") {
    const n = Number(progress);
    if (Number.isFinite(n)) return n;
  }
  return isCompleted ? 100 : 0;
}

function formatAdminGoalProgressLabel(p) {
  const v = Math.max(0, Math.min(100, p));
  const r = Math.round(v * 10) / 10;
  return r % 1 === 0 ? String(Math.round(r)) : r.toFixed(1);
}

function readCachedPublicIp() {
  try {
    return sessionStorage.getItem("clientPublicIp") || "";
  } catch {
    return "";
  }
}

// ── Tab configuration ──────────────────────────────────────
const TABS = [
  { key: "analytics",     icon: "📊", label: "Analytics" },
  { key: "users",         icon: "👥", label: "Users" },
  { key: "goals",         icon: "🎯", label: "Goals" },
  { key: "badges",        icon: "🏅", label: "Badges" },
  { key: "leaderboard",   icon: "🏆", label: "Leaderboard" },
  { key: "marketplace",   icon: "🛒", label: "Marketplace" },
  { key: "transactions",  icon: "💳", label: "Transactions" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
  { key: "contact-inbox", icon: "✉️", label: "Contact" },
  { key: "admin-logs",    icon: "🧾", label: "Admin Logs" },
  { key: "settings",      icon: "⚙", label: "Settings" },
];

function getInitialTabFromSearch() {
  if (typeof window === "undefined") return "analytics";
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const validKeys = TABS.map((t) => t.key);
    if (tabParam && validKeys.includes(tabParam)) {
      return tabParam;
    }
  } catch {
    /* ignore */
  }
  return "analytics";
}

// ── Mock Data / Fallbacks ─────────────────────────────────
const MOCK_USERS = [
  { id: 101, name: "Rahul Sharma", email: "rahul@gmail.com", role: "User", status: "Active", createdAt: "2024-11-15" },
  { id: 102, name: "Neha Gupta", email: "neha@gmail.com", role: "User", status: "Active", createdAt: "2024-12-01" },
  { id: 103, name: "Aman Verma", email: "aman@gmail.com", role: "User", status: "Active", createdAt: "2025-01-10" },
  { id: 104, name: "Priya Singh", email: "priya@gmail.com", role: "User", status: "Inactive", createdAt: "2024-10-20" },
  { id: 105, name: "Admin User", email: "admin@gmail.com", role: "Admin", status: "Active", createdAt: "2024-09-01" },
];

const MOCK_SURVEYS = [
  { id: 1, user: "Rahul Sharma", transport: "Car – 20 km/day", diet: "Non-Vegetarian", energy: "Electricity – 300 kWh/month", date: "2025-02-10" },
  { id: 2, user: "Neha Gupta", transport: "Public Transit", diet: "Vegetarian", energy: "Electricity – 180 kWh/month", date: "2025-02-12" },
  { id: 3, user: "Aman Verma", transport: "Bicycle", diet: "Vegan", energy: "Solar + Grid – 120 kWh/month", date: "2025-02-15" },
  { id: 4, user: "Priya Singh", transport: "Motorbike – 15 km/day", diet: "Non-Vegetarian", energy: "Electricity – 250 kWh/month", date: "2025-02-18" },
];

const MOCK_CARBON_LOGS = [
  { id: 1, user: "Rahul Sharma", date: "2025-03-10", totalEmission: 45, transport: 20, food: 12, energy: 13 },
  { id: 2, user: "Neha Gupta", date: "2025-03-10", totalEmission: 38, transport: 10, food: 8, energy: 20 },
  { id: 3, user: "Aman Verma", date: "2025-03-10", totalEmission: 22, transport: 5, food: 7, energy: 10 },
  { id: 4, user: "Priya Singh", date: "2025-03-09", totalEmission: 50, transport: 22, food: 14, energy: 14 },
  { id: 5, user: "Rahul Sharma", date: "2025-03-09", totalEmission: 42, transport: 18, food: 11, energy: 13 },
];

const MOCK_GOALS = [
  { id: 1, user: "Rahul Sharma", title: "Reduce monthly emissions", target: 30, current: 45, status: "Active" },
  { id: 2, user: "Neha Gupta", title: "Reduce transport usage", target: 5, current: 5, status: "Completed" },
  { id: 3, user: "Aman Verma", title: "Go zero energy emission", target: 0, current: 10, status: "Active" },
  { id: 4, user: "Priya Singh", title: "Switch to vegetarian diet", target: 5, current: 14, status: "Active" },
];

const MOCK_BADGES = [
  { id: 1, name: "Eco Starter", icon: "🌱", condition: "Complete first survey", active: true, usersEarned: 4 },
  { id: 2, name: "Green Achiever", icon: "🏆", condition: "Complete first goal", active: true, usersEarned: 1 },
  { id: 3, name: "Carbon Saver", icon: "✂️", condition: "Reduce emissions by 20%", active: true, usersEarned: 0 },
  { id: 4, name: "Week Warrior", icon: "📅", condition: "Log 7 consecutive days", active: true, usersEarned: 2 },
  { id: 5, name: "Solar Hero", icon: "☀️", condition: "Zero energy emissions for a week", active: false, usersEarned: 0 },
];

const MOCK_LEADERBOARD = [
  { rank: 1, user: "Rahul Sharma", totalCarbonOffsetPurchased: 25, goalsCompleted: 3, badgesEarned: 4, score: 1350 },
  { rank: 2, user: "Neha Gupta", totalCarbonOffsetPurchased: 20, goalsCompleted: 2, badgesEarned: 3, score: 1070 },
  { rank: 3, user: "Aman Verma", totalCarbonOffsetPurchased: 18, goalsCompleted: 1, badgesEarned: 3, score: 970 },
  { rank: 4, user: "Priya Singh", totalCarbonOffsetPurchased: 10, goalsCompleted: 0, badgesEarned: 2, score: 520 },
];

const MOCK_MARKETPLACE = [
  { id: 1, name: "Tree Planting", icon: "🌳", type: "Carbon Offset", price: 200, desc: "Plant a tree to offset your carbon emissions." },
  { id: 2, name: "Solar Energy Support", icon: "☀️", type: "Renewable Energy", price: 500, desc: "Support solar energy projects." },
  { id: 3, name: "Carbon Credit", icon: "📜", type: "Carbon Credit", price: 350, desc: "Purchase verified carbon credits." },
  { id: 4, name: "Clean Water Initiative", icon: "💧", type: "Social Impact", price: 150, desc: "Fund clean water access projects." },
];

const MOCK_TRANSACTIONS = [
  { id: 1, user: "Rahul Sharma", item: "Tree Planting", amount: 200, date: "2025-03-08", status: "Completed" },
  { id: 2, user: "Neha Gupta", item: "Carbon Credit", amount: 500, date: "2025-03-09", status: "Completed" },
  { id: 3, user: "Aman Verma", item: "Solar Energy Support", amount: 500, date: "2025-03-10", status: "Pending" },
  { id: 4, user: "Priya Singh", item: "Tree Planting", amount: 200, date: "2025-03-11", status: "Completed" },
];

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "GOAL",
    title: "Goal completed",
    message: "Congratulations! You completed your goal Reduce monthly emissions by 20%.",
    createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    isRead: false,
    user: { id: 2, email: "user@example.com" },
  },
  {
    id: 2,
    type: "BADGE",
    title: "New badge",
    message: "You earned the Eco Starter badge! 🌿 Keep up the great work.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
    user: null,
  },
  {
    id: 3,
    type: "LEADERBOARD",
    title: "Rank up",
    message: "Your rank improved! You are now ranked #3 on the leaderboard.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: true,
    user: { id: 1, email: "demo@example.com" },
  },
];

/** Same taxonomy as user Notifications page (CSS classes: goal, badge, …) */
const ADMIN_NOTIF_TYPE_META = {
  goal: { icon: "🎯", label: "Goal" },
  badge: { icon: "🏅", label: "Badge" },
  leaderboard: { icon: "🏆", label: "Leaderboard" },
  emission: { icon: "⚠️", label: "Emission" },
  purchase: { icon: "🛒", label: "Purchase" },
  system: { icon: "🔔", label: "System" },
};

function mapAdminNotificationTypeKey(type) {
  if (!type) return "system";
  const t = String(type).toLowerCase();
  if (t === "purchase_pending") return "purchase";
  if (["goal", "badge", "leaderboard", "emission", "purchase", "system"].includes(t)) return t;
  return "system";
}

function adminNotificationTimeAgo(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getMarketplaceBannerFromCategory(category) {
  switch (category) {
    case "Carbon Offset":
      return "carbon-offset";
    case "Renewable Energy":
      return "renewable-energy";
    case "Environmental":
      return "environmental";
    case "Sustainable Living":
      return "sustainable-living";
    default:
      return "carbon-offset";
  }
}

function normalizeMarketplaceCategory(rawType) {
  const raw = String(rawType || "").trim();
  const compact = raw.toLowerCase().replace(/[_\s-]+/g, "");
  if (compact === "carbonoffset") return "Carbon Offset";
  if (compact === "renewableenergy") return "Renewable Energy";
  if (compact === "environmental") return "Environmental";
  if (compact === "sustainableliving") return "Sustainable Living";
  return raw || "General";
}

function isAdminNotifAlertError(msg) {
  if (!msg) return false;
  const l = msg.toLowerCase();
  return l.includes("failed") || l.includes("required") || l.includes("select a user");
}

function formatAdminNotificationMessage(notification, typeKey) {
  let original = String(notification?.message || "").replace(/\[\[tx:\d+\]\]\s*/g, "").trim();
  original = original.replace(/\s+or tap the button in this notification\.?/gi, "").trim();
  if (typeKey !== "purchase") return original;

  // Purchase text is user-facing ("You purchased ..."). In admin view, show actor context.
  if (/^you purchased\b/i.test(original)) {
    const actorEmail =
      notification?.user?.email ||
      notification?.userEmail ||
      notification?.recipientEmail ||
      null;
    if (actorEmail) {
      return original.replace(/^you purchased\b/i, `${actorEmail} purchased`);
    }
    return original.replace(/^you purchased\b/i, "A user purchased");
  }

  return original;
}

const ADMIN_PAGE_SIZE = 10;

function buildAdminPageItems(totalPages, page) {
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

/** Same filtering as the Users tab table (non-admin users only). */
function getAdminFilteredUsers(allUsers, userFilter, searchTerm) {
  const sourceUsers =
    Array.isArray(allUsers) && allUsers.length > 0 ? allUsers : MOCK_USERS;
  const normalized = sourceUsers
    .filter((u) => {
      const role = (u.role || u.userRole || "").toString().toLowerCase();
      return role !== "admin";
    })
    .map((u) => {
      const isActive =
        typeof u.active === "boolean"
          ? u.active
          : (u.status || "Active") === "Active";
      return {
        raw: u,
        id: u.id,
        name: (u.name || u.username || u.email || "").toString(),
        email: (u.email || "").toString(),
        role: (u.role || u.userRole || "User").toString(),
        status: isActive ? "Active" : "Blocked",
        active: isActive,
        createdAt: (
          u.createdAt ||
          u.createdDate ||
          u.createdOn ||
          ""
        ).toString(),
      };
    });
  return normalized
    .filter((u) => {
      if (userFilter === "active") return u.active;
      if (userFilter === "blocked") return !u.active;
      return true;
    })
    .filter((u) => {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
}

function getFilteredAuditLogs(auditLogs, auditFilter) {
  return (Array.isArray(auditLogs) ? auditLogs : []).filter((l) => {
    if (auditFilter === "all") return true;
    const action = (l.action || "").toString().toLowerCase();
    if (auditFilter === "login") return action.includes("login");
    if (auditFilter === "logout") return action.includes("logout");
    if (auditFilter === "settings") return action.includes("setting");
    if (auditFilter === "marketplace") return action.includes("marketplace") || action.includes("item");
    if (auditFilter === "notification") return action.includes("notification");
    if (auditFilter === "badge") return action.includes("badge");
    if (auditFilter === "user") return action.includes("user") || action.includes("block");
    return true;
  });
}

function mapAdminTransactionRows(adminTransactions) {
  return (Array.isArray(adminTransactions) ? adminTransactions : []).map((t, idx) => {
    const uName = (t.userName || "").trim();
    const uEmail = (t.userEmail || "").trim();
    const user =
      uName || uEmail || t.user?.name || t.user?.email || "Unknown User";
    const item =
      (t.itemName || "").trim() ||
      t.marketplaceItem?.itemName ||
      t.item ||
      "Marketplace Item";
    return {
      id: t.id ?? idx + 1,
      user,
      item,
      amount: Number(t.amount || 0),
      date: t.createdAt || t.date || "",
      status: (t.status || "COMPLETED").toString(),
    };
  });
}

function normalizeAdminNotificationRows(rawList) {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map((n, idx) => {
    const typeKey = mapAdminNotificationTypeKey(n.type);
    const read =
      n.isRead === true ||
      n.read === true ||
      (typeof n.isRead === "boolean" ? n.isRead : false);
    const title = n.title || "";
    const message = formatAdminNotificationMessage(n, typeKey);
    const ts = n.createdAt || n.date || n.updatedAt || "";
    return {
      id: n.id ?? idx + 1,
      typeKey,
      title,
      message,
      timestamp: ts,
      read,
      raw: n,
    };
  });
}

function filterAdminNotificationRows(normalizedRows, adminNotificationFilter) {
  const validAdminNotifFilters = new Set([
    "all",
    "goal",
    "badge",
    "leaderboard",
    "emission",
    "purchase",
    "system",
  ]);
  const activeFilter = validAdminNotifFilters.has(adminNotificationFilter)
    ? adminNotificationFilter
    : "all";
  return normalizedRows.filter((r) => {
    if (activeFilter === "all") return true;
    return r.typeKey === activeFilter;
  });
}

function AdminPaginationBar({ page, setPage, totalCount, ariaLabel }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_PAGE_SIZE));
  const pageItems = useMemo(
    () => buildAdminPageItems(totalPages, page),
    [totalPages, page]
  );
  if (totalCount <= 0) return null;
  return (
    <nav className="admin-pagination" aria-label={ariaLabel || "Pages"}>
      <span className="admin-pagination-range">
        Showing {(page - 1) * ADMIN_PAGE_SIZE + 1}–
        {Math.min(page * ADMIN_PAGE_SIZE, totalCount)} of {totalCount}
      </span>
      {totalPages > 1 && (
        <div className="admin-pagination-controls">
          <button
            type="button"
            className="admin-pagination-nav"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="admin-pagination-pages">
            {pageItems.map((item, idx) =>
              item === "ellipsis" ? (
                <span key={`e-${idx}`} className="admin-pagination-ellipsis" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`admin-pagination-page ${page === item ? "active" : ""}`}
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
            className="admin-pagination-nav"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </nav>
  );
}

function getWeekStartOffset(offsetWeeks = 0) {
  const d = new Date();
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday + offsetWeeks * 7);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_CALCULATION_FACTORS = {
  electricityFactor: "0.82",
  carPetrolFactor: "0.21",
  carDieselFactor: "0.18",
  carElectricFactor: "0.05",
  transportFactor: "0.12",
  bikeFactor: "0.024",
  foodVegFactor: "1.5",
  foodNonVegFactor: "3.3",
};

// ── Main Component ─────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(getInitialTabFromSearch);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all"); // all | active | blocked

  // Admin data that should use real backend where available
  const [adminLeaderboard, setAdminLeaderboard] = useState([]);
  const [adminWeeklyLeaderboard, setAdminWeeklyLeaderboard] = useState([]);
  const [adminLeaderboardFilter, setAdminLeaderboardFilter] = useState("live"); // live | last-week
  const [adminBadges, setAdminBadges] = useState(MOCK_BADGES);
  const [adminCarbonLogs, setAdminCarbonLogs] = useState([]);
  const [adminGoals, setAdminGoals] = useState([]);
  const [adminMarketplaceItems, setAdminMarketplaceItems] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminContactMessages, setAdminContactMessages] = useState([]);
  const [contactInboxSearch, setContactInboxSearch] = useState("");
  const [contactInboxReadFilter, setContactInboxReadFilter] = useState("all"); // all | unread | read
  const [contactReplyModal, setContactReplyModal] = useState(null); // { id, email, name } | null
  const [contactReplySubject, setContactReplySubject] = useState("");
  const [contactReplyMessage, setContactReplyMessage] = useState("");
  const [contactReplyError, setContactReplyError] = useState("");
  const [contactReplySending, setContactReplySending] = useState(false);
  const [contactInboxLoadError, setContactInboxLoadError] = useState("");
  /** null | { toEmail, subject, body } — read-only modal for a sent reply */
  const [contactViewReplyModal, setContactViewReplyModal] = useState(null);
  const [adminNotificationFilter, setAdminNotificationFilter] = useState("all");

  useEffect(() => {
    const allowed = new Set(["all", "goal", "badge", "leaderboard", "emission", "purchase", "system"]);
    if (!allowed.has(adminNotificationFilter)) {
      setAdminNotificationFilter("all");
    }
  }, [adminNotificationFilter]);
  const [adminSettings, setAdminSettings] = useState({
    appName: "CarbonCalc",
    logoDataUrl: "",
    emissionThreshold: "",
    ...DEFAULT_CALCULATION_FACTORS,
    appVersion: "",
    maintenanceMode: false,
    lastUpdatedBy: "",
    lastUpdatedAt: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [marketplaceMessage, setMarketplaceMessage] = useState("");
  const [showMarketplaceForm, setShowMarketplaceForm] = useState(false);
  const [editingMarketplaceId, setEditingMarketplaceId] = useState(null);
  const [marketplaceSubmitting, setMarketplaceSubmitting] = useState(false);
  const [adminMarketplaceSearch, setAdminMarketplaceSearch] = useState("");
  const [adminMarketplaceCategory, setAdminMarketplaceCategory] = useState("All");
  const [marketplaceDraft, setMarketplaceDraft] = useState({
    itemName: "",
    itemType: "Carbon Offset",
    price: "",
    description: "",
    carbonOffsetValue: "",
  });

  const marketplaceAdminCategories = [
    "Carbon Offset",
    "Renewable Energy",
    "Environmental",
    "Sustainable Living",
  ];
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [editingNotificationId, setEditingNotificationId] = useState(null);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);
  const [notificationDraft, setNotificationDraft] = useState({
    title: "",
    type: "SYSTEM",
    message: "",
    audience: "all",
    userId: "",
  });
  const notificationFormCloseTimerRef = useRef(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState(null);

  // All users (for admin badge assignment, filtered by name/email instead of raw ID)
  const [allUsers, setAllUsers] = useState([]);

  // Badge templates (source of truth for edit / enable / disable)
  const [badgeTemplates, setBadgeTemplates] = useState([]);

  // Simple inline form for awarding a badge to a user by ID
  const [badgeForm, setBadgeForm] = useState({
    userId: "",
    badgeName: "",
    description: "",
  });
  const [badgeUserQuery, setBadgeUserQuery] = useState("");
  const [selectedBadgeUser, setSelectedBadgeUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [badgeSelectedTemplateId, setBadgeSelectedTemplateId] = useState("");
  const [badgeEditId, setBadgeEditId] = useState(null);
  const [badgeEditDraft, setBadgeEditDraft] = useState({
    name: "",
    conditionText: "",
    icon: "",
    active: true,
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    conditionText: "",
    icon: "",
    active: true,
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [showCreateTemplateForm, setShowCreateTemplateForm] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [badgeSavingId, setBadgeSavingId] = useState(null);
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);
  const [badgeMessage, setBadgeMessage] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("all"); // all | active | disabled
  const [auditFilter, setAuditFilter] = useState("all"); // all | login | logout | settings | marketplace | notification | badge | user

  const [adminUsersPage, setAdminUsersPage] = useState(1);
  const [adminTxPage, setAdminTxPage] = useState(1);
  const [adminTxStatusFilter, setAdminTxStatusFilter] = useState("all");
  const [adminNotifListPage, setAdminNotifListPage] = useState(1);
  const [adminAuditPage, setAdminAuditPage] = useState(1);
  const [adminBadgesPage, setAdminBadgesPage] = useState(1);
  const [adminGoalsPage, setAdminGoalsPage] = useState(1);
  const [adminGoalsStatusFilter, setAdminGoalsStatusFilter] = useState("all");
  const [adminGoalsCategoryFilter, setAdminGoalsCategoryFilter] = useState("all");
  const [adminLeaderboardPage, setAdminLeaderboardPage] = useState(1);
  const [adminMarketplacePage, setAdminMarketplacePage] = useState(1);

  const adminFilteredUsers = useMemo(
    () => getAdminFilteredUsers(allUsers, userFilter, searchTerm),
    [allUsers, userFilter, searchTerm]
  );

  const adminTxRows = useMemo(
    () => mapAdminTransactionRows(adminTransactions),
    [adminTransactions]
  );

  const adminNotifFiltered = useMemo(() => {
    const normalized = normalizeAdminNotificationRows(adminNotifications);
    return filterAdminNotificationRows(normalized, adminNotificationFilter);
  }, [adminNotifications, adminNotificationFilter]);

  const adminAuditFiltered = useMemo(
    () => getFilteredAuditLogs(auditLogs, auditFilter),
    [auditLogs, auditFilter]
  );

  const baseBadgesForAdmin = badgeTemplates.length > 0 ? badgeTemplates : adminBadges;
  const adminFilteredBadges = useMemo(() => {
    return baseBadgesForAdmin.filter((b) => {
      const isActive = b.active ?? true;
      if (badgeFilter === "active") return isActive;
      if (badgeFilter === "disabled") return !isActive;
      return true;
    });
  }, [baseBadgesForAdmin, badgeFilter]);

  useEffect(() => {
    setAdminUsersPage(1);
  }, [userFilter, searchTerm]);

  useEffect(() => {
    setAdminAuditPage(1);
  }, [auditFilter]);

  useEffect(() => {
    setAdminNotifListPage(1);
  }, [adminNotificationFilter]);

  useEffect(() => {
    setAdminTxPage(1);
  }, [adminTxStatusFilter]);

  useEffect(() => {
    setAdminBadgesPage(1);
  }, [badgeFilter]);

  useEffect(() => {
    setAdminMarketplacePage(1);
  }, [adminMarketplaceSearch, adminMarketplaceCategory]);

  useEffect(() => {
    setAdminLeaderboardPage(1);
  }, [adminLeaderboardFilter]);

  useEffect(() => {
    setAdminGoalsPage(1);
  }, [adminGoalsStatusFilter, adminGoalsCategoryFilter]);

  useEffect(() => {
    setAdminUsersPage(1);
    setAdminTxPage(1);
    setAdminNotifListPage(1);
    setAdminAuditPage(1);
    setAdminBadgesPage(1);
    setAdminGoalsPage(1);
    setAdminLeaderboardPage(1);
    setAdminMarketplacePage(1);
  }, [activeTab]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(adminFilteredUsers.length / ADMIN_PAGE_SIZE));
    setAdminUsersPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminFilteredUsers.length]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(adminTxRows.length / ADMIN_PAGE_SIZE));
    setAdminTxPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminTxRows.length]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(adminNotifFiltered.length / ADMIN_PAGE_SIZE));
    setAdminNotifListPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminNotifFiltered.length]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(adminAuditFiltered.length / ADMIN_PAGE_SIZE));
    setAdminAuditPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminAuditFiltered.length]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(adminFilteredBadges.length / ADMIN_PAGE_SIZE));
    setAdminBadgesPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminFilteredBadges.length]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil((Array.isArray(adminGoals) ? adminGoals.length : 0) / ADMIN_PAGE_SIZE));
    setAdminGoalsPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminGoals.length]);

  useEffect(() => {
    const rowsCount =
      adminLeaderboardFilter === "last-week"
        ? adminWeeklyLeaderboard.length
        : (adminLeaderboard.length ? adminLeaderboard.length : adminWeeklyLeaderboard.length);
    const tp = Math.max(1, Math.ceil(rowsCount / ADMIN_PAGE_SIZE));
    setAdminLeaderboardPage((p) => Math.min(Math.max(1, p), tp));
  }, [adminLeaderboard.length, adminWeeklyLeaderboard.length, adminLeaderboardFilter]);

  useEffect(() => {
    const id = axios.interceptors.request.use(async (config) => {
      let ip = readCachedPublicIp();
      if (!ip) {
        try {
          const r = await fetch("https://api.ipify.org?format=json");
          const d = await r.json();
          if (d && d.ip) {
            try {
              sessionStorage.setItem("clientPublicIp", d.ip);
            } catch {
              /* ignore */
            }
            ip = d.ip;
          }
        } catch {
          /* ignore — backend still has socket IP */
        }
      }
      if (ip) {
        return { ...config, headers: { ...config.headers, "X-Public-IP": ip } };
      }
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setAuditLogsLoading(true);
      setAuditLogsError(null);
      const res = await axios.get(`${API_BASE}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setAuditLogs([]);
      const status = e.response?.status;
      const data = e.response?.data;
      const detail =
        typeof data === "string"
          ? data
          : data?.message || data?.error;
      let msg = "Failed to load audit logs.";
      if (status === 401) {
        msg = "Session expired. Sign in again.";
      } else if (e.code === "ERR_NETWORK" || e.message === "Network Error") {
        msg = `Cannot reach the server. Check that the API is running (${API_ORIGIN}).`;
      } else if (detail) {
        msg = String(detail);
      }
      setAuditLogsError(msg);
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  const closeNotificationForm = useCallback(() => {
    if (notificationFormCloseTimerRef.current) {
      clearTimeout(notificationFormCloseTimerRef.current);
      notificationFormCloseTimerRef.current = null;
    }
    setShowNotificationForm(false);
    setEditingNotificationId(null);
    setNotificationMessage("");
  }, []);

  useEffect(() => {
    return () => {
      if (notificationFormCloseTimerRef.current) {
        clearTimeout(notificationFormCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user && activeTab === "admin-logs") {
      fetchAuditLogs();
    }
  }, [user, activeTab, fetchAuditLogs]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setBadgeMessage("");

    if (!newTemplate.name) {
      setBadgeMessage("Template name is required.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setCreatingTemplate(true);
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        name: newTemplate.name,
        description: newTemplate.description,
        conditionText: newTemplate.conditionText,
        icon: newTemplate.icon,
        active: newTemplate.active,
      };

      if (editingTemplateId) {
        // Update existing template
        const res = await axios.put(
          `${API_BASE}/badge-templates/${editingTemplateId}`,
          payload,
          { headers }
        );
        const updated = res.data;
        setBadgeTemplates((prev) =>
          Array.isArray(prev)
            ? prev.map((b) => (b.id === updated.id ? updated : b))
            : prev
        );
        setBadgeMessage("Badge template updated successfully.");
        fetchAuditLogs();
      } else {
        // Create new template
        const res = await axios.post(
          `${API_BASE}/badge-templates`,
          payload,
          { headers }
        );
        const created = res.data;
        setBadgeTemplates((prev) =>
          Array.isArray(prev) ? [...prev, created] : [created]
        );
        setBadgeMessage("New badge template created successfully.");
        fetchAuditLogs();
      }

      setNewTemplate({
        name: "",
        description: "",
        conditionText: "",
        icon: "",
        active: true,
      });
      setEditingTemplateId(null);
      setShowCreateTemplateForm(false);
    } catch (err) {
      setBadgeMessage(
        "Failed to create badge template. Please check the values and try again."
      );
    } finally {
      setCreatingTemplate(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    setLoadError("");
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${API_BASE}/auth/me`, { headers })
      .then((res) => {
        setUser(res.data);

        // Fetch data needed for admin views in parallel
        Promise.allSettled([
          // Leaderboard for admin view
          axios.get(`${API_BASE}/leaderboard`, { headers }),
          // Weekly leaderboard snapshot for admin view
          axios.get(`${API_BASE}/leaderboard/weekly`, { headers }),
          // Badge stats for admin analytics (global counts)
          axios.get(`${API_BASE}/badges/admin/stats`, { headers }),
          // Carbon logs for all non-admin users (admin analytics)
          axios.get(`${API_BASE}/carbon/logs/admin/all`, { headers }),
          // Goals for all non-admin users (admin dashboard)
          axios.get(`${API_BASE}/goals/admin`, { headers }),
          // All users – used to search & select a user instead of manual ID
          axios.get(`${API_BASE}/users`, { headers }),
          // Badge templates – used for editing / enabling / disabling badges
          axios.get(`${API_BASE}/badge-templates`, { headers }),
          // Marketplace catalog for admin
          axios.get(`${API_BASE}/marketplace/admin/all`, { headers }),
          // Marketplace transactions for admin
          axios.get(`${API_BASE}/transactions/admin/all`, { headers }),
          // All notifications for admin monitoring
          axios.get(`${API_BASE}/notifications/admin/all`, { headers }),
          // Public site contact form submissions (admin only)
          axios.get(`${API_BASE}/contact/messages/admin`, { headers }),
          // Admin settings
          axios.get(`${API_BASE}/admin/settings`, { headers }),
        ]).then((results) => {
          const [
            lbResult,
            lbWeeklyResult,
            badgeResult,
            carbonResult,
            goalsResult,
            usersResult,
            templatesResult,
            marketplaceResult,
            txResult,
            notificationsResult,
            contactInboxResult,
            settingsResult,
          ] = results;

          if (lbResult.status === "fulfilled") {
            const lbRes = lbResult.value;
            const data = Array.isArray(lbRes.data) ? lbRes.data : [];
            if (data.length > 0) {
              const mapped = data
                .map((e, index) => ({
                  rank: index + 1,
                  user:
                    e.userName ||
                    e.username ||
                    e.user?.name ||
                    e.user?.username ||
                    `User ${index + 1}`,
                  totalCarbonOffsetPurchased: Number(e.totalCarbonOffsetPurchased) || 0,
                  goalsCompleted: e.goalsCompleted ?? 0,
                  badgesEarned: e.badgesEarned ?? 0,
                  score: Number(e.score) || 0,
                }))
                .sort((a, b) => b.score - a.score);
              mapped.forEach((entry, idx) => {
                entry.rank = idx + 1;
              });
              setAdminLeaderboard(mapped);
            }
          }

          if (lbWeeklyResult.status === "fulfilled") {
            const lbRes = lbWeeklyResult.value;
            const data = Array.isArray(lbRes.data) ? lbRes.data : [];
            if (data.length > 0) {
              const mapped = data
                .map((e, index) => ({
                  rank: index + 1,
                  user:
                    e.userName ||
                    e.username ||
                    e.user?.name ||
                    e.user?.username ||
                    `User ${index + 1}`,
                  totalCarbonOffsetPurchased: Number(e.totalCarbonOffsetPurchased) || 0,
                  goalsCompleted: e.goalsCompleted ?? 0,
                  badgesEarned: e.badgesEarned ?? 0,
                  score: Number(e.score) || 0,
                }))
                .sort((a, b) => b.score - a.score);
              mapped.forEach((entry, idx) => {
                entry.rank = idx + 1;
              });
              setAdminWeeklyLeaderboard(mapped);
            }
          }


          if (badgeResult.status === "fulfilled") {
            const bRes = badgeResult.value;
            const stats = Array.isArray(bRes.data) ? bRes.data : [];
            if (stats.length > 0) {
              const mapped = stats.map((b, index) => ({
                id: index + 1,
                name: b.badgeName || b.name || `Badge ${index + 1}`,
                icon: "🏅",
                condition: "Global badge analytics",
                active: true,
                usersEarned: Number(b.usersEarned || 0),
              }));
              setAdminBadges(mapped);
            }
          }

          if (carbonResult.status === "fulfilled") {
            const cRes = carbonResult.value;
            const list = Array.isArray(cRes.data) ? cRes.data : [];
            setAdminCarbonLogs(list);
          }

          if (goalsResult.status === "fulfilled") {
            const gRes = goalsResult.value;
            const list = Array.isArray(gRes.data) ? gRes.data : [];
            setAdminGoals(list);
          }

          if (usersResult.status === "fulfilled") {
            const uRes = usersResult.value;
            const list = Array.isArray(uRes.data) ? uRes.data : [];
            setAllUsers(list);
          }

          if (templatesResult.status === "fulfilled") {
            const tRes = templatesResult.value;
            const list = Array.isArray(tRes.data) ? tRes.data : [];
            setBadgeTemplates(list);
          }

          if (marketplaceResult.status === "fulfilled") {
            const mRes = marketplaceResult.value;
            const list = Array.isArray(mRes.data) ? mRes.data : [];
            setAdminMarketplaceItems(list);
          }

          if (txResult.status === "fulfilled") {
            const trRes = txResult.value;
            const list = Array.isArray(trRes.data) ? trRes.data : [];
            setAdminTransactions(list);
          }

          if (notificationsResult.status === "fulfilled") {
            const nRes = notificationsResult.value;
            const list = Array.isArray(nRes.data) ? nRes.data : [];
            setAdminNotifications(list);
          }

          if (contactInboxResult.status === "fulfilled") {
            const cRes = contactInboxResult.value;
            const list = Array.isArray(cRes.data) ? cRes.data : [];
            setAdminContactMessages(list);
            setContactInboxLoadError("");
          } else {
            const reason = contactInboxResult.reason;
            const status = reason?.response?.status;
            const body = reason?.response?.data;
            const detail =
              (typeof body === "string" && body) ||
              body?.message ||
              body?.error ||
              (Array.isArray(body?.errors) ? String(body.errors[0]) : null) ||
              reason?.message ||
              "Request failed";
            setContactInboxLoadError(
              status
                ? `Could not load contact inbox (HTTP ${status}). ${detail}`
                : `Could not load contact inbox. ${detail}`
            );
            setAdminContactMessages([]);
          }

          if (settingsResult.status === "fulfilled") {
            const sRes = settingsResult.value;
            const settings = sRes.data && typeof sRes.data === "object" ? sRes.data : {};
            setAdminSettings({
              appName: settings.appName ?? "CarbonCalc",
              logoDataUrl: settings.logoDataUrl ?? "",
              emissionThreshold: settings.emissionThreshold ?? "",
              electricityFactor: settings.electricityFactor ?? DEFAULT_CALCULATION_FACTORS.electricityFactor,
              carPetrolFactor: settings.carPetrolFactor ?? DEFAULT_CALCULATION_FACTORS.carPetrolFactor,
              carDieselFactor: settings.carDieselFactor ?? DEFAULT_CALCULATION_FACTORS.carDieselFactor,
              carElectricFactor: settings.carElectricFactor ?? DEFAULT_CALCULATION_FACTORS.carElectricFactor,
              transportFactor: settings.transportFactor ?? DEFAULT_CALCULATION_FACTORS.transportFactor,
              bikeFactor: settings.bikeFactor ?? DEFAULT_CALCULATION_FACTORS.bikeFactor,
              foodVegFactor: settings.foodVegFactor ?? DEFAULT_CALCULATION_FACTORS.foodVegFactor,
              foodNonVegFactor: settings.foodNonVegFactor ?? DEFAULT_CALCULATION_FACTORS.foodNonVegFactor,
              appVersion: settings.appVersion ?? "",
              maintenanceMode: Boolean(settings.maintenanceMode),
              lastUpdatedBy: settings.lastUpdatedBy ?? "",
              lastUpdatedAt: settings.lastUpdatedAt ?? "",
            });
          }
        }).finally(() => {
          setLoading(false);
        });
      })
      .catch((err) => {
        const detail =
          typeof err?.response?.data === "string"
            ? err.response.data
            : err?.response?.data?.message || err?.message;
        setLoadError(
          detail
            ? `Could not load admin panel: ${detail}`
            : `Could not reach the API (${API_ORIGIN}). Check that the backend is running.`
        );
        setLoading(false);
      });
  }, [navigate]);

  useEffect(() => {
    if (adminLeaderboardFilter === "live") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const weekStart = getWeekStartOffset(-1);
    axios
      .get(
        `${API_BASE}/leaderboard/weekly?weekStart=${encodeURIComponent(weekStart)}`,
        { headers }
      )
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const mapped = data
          .map((e, index) => ({
            rank: index + 1,
            user:
              e.userName ||
              e.username ||
              e.user?.name ||
              e.user?.username ||
              `User ${index + 1}`,
            totalCarbonOffsetPurchased: Number(e.totalCarbonOffsetPurchased) || 0,
            goalsCompleted: e.goalsCompleted ?? 0,
            badgesEarned: e.badgesEarned ?? 0,
            score: Number(e.score) || 0,
          }))
          .sort((a, b) => b.score - a.score);
        mapped.forEach((entry, idx) => {
          entry.rank = idx + 1;
        });
        setAdminWeeklyLeaderboard(mapped);
      })
      .catch(() => {
        setAdminWeeklyLeaderboard([]);
      });
  }, [adminLeaderboardFilter]);

  // Sync active tab with URL query (?tab=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const validKeys = TABS.map((t) => t.key);
    if (tabParam && validKeys.includes(tabParam)) {
      setActiveTab(tabParam);
      setSearchTerm("");
    } else {
      setActiveTab("analytics");
    }
  }, [location.search]);

  if (loading) {
    return (
      <AppLayout>
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading admin panel…</p>
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className="admin-denied">
          <span className="admin-denied-icon">⚠️</span>
          <h2>Admin panel unavailable</h2>
          <p>{loadError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/login")}
            style={{ marginTop: 16 }}
          >
            Back to login
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <AppLayout>
        <div className="admin-denied">
          <span className="admin-denied-icon">🛡️</span>
          <h2>Access Denied</h2>
          <p>You don't have admin privileges to access this page.</p>
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")} style={{ marginTop: 16 }}>
            Go to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── Active tab info
  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  // ── Render content for each section ──
  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return renderAnalytics();
      case "users":
        return renderUsers();
      case "goals":
        return renderGoals();
      case "badges":
        return renderBadges();
      case "leaderboard":
        return renderLeaderboard();
      case "marketplace":
        return renderMarketplace();
      case "transactions":
        return renderTransactions();
      case "notifications":
        return renderNotifications();
      case "contact-inbox":
        return renderContactInbox();
      case "admin-logs":
        return renderAdminLogs();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  // ══════════════════════════════════════════
  // 1. SYSTEM ANALYTICS
  // ══════════════════════════════════════════
  function renderAnalytics() {
    const totalUsers = Array.isArray(allUsers) && allUsers.length
      ? allUsers.filter((u) => (u.role || "").toString().toLowerCase() !== "admin").length
      : MOCK_USERS.length;

    const carbonSource = Array.isArray(adminCarbonLogs) && adminCarbonLogs.length
      ? adminCarbonLogs.filter((l) => {
          const role = (l.user?.role || "").toString().toLowerCase();
          return !role.includes("admin");
        })
      : MOCK_CARBON_LOGS;

    const avgEmissions = carbonSource.length
      ? (
          carbonSource.reduce((s, l) => s + Number(l.totalEmission || 0), 0) /
          carbonSource.length
        ).toFixed(2)
      : "0.00";

    // Today's emissions and category breakdown (Food / Transport / Energy)
    let todaysEmissions = 0;
    let sumTransport = 0;
    let sumFood = 0;
    let sumEnergy = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    carbonSource.forEach((l) => {
      const total = Number(l.totalEmission || 0);
      const transport = Number(l.transportEmission || 0);
      const food = Number(l.foodEmission || 0);
      const energy = Number(l.energyEmission || 0);
      const dateRaw = l.date || l.logDate || l.createdAt || "";
      const dateStr =
        typeof dateRaw === "string"
          ? dateRaw.slice(0, 10)
          : new Date(dateRaw).toISOString().slice(0, 10);

      if (dateStr === todayStr) {
        todaysEmissions += total;
      }
      sumTransport += transport;
      sumFood += food;
      sumEnergy += energy;
    });

    const categoryTotals = [
      { key: "Transport", value: sumTransport },
      { key: "Food", value: sumFood },
      { key: "Energy", value: sumEnergy },
    ];
    const topCategoryEntry = categoryTotals.reduce(
      (best, curr) => (curr.value > best.value ? curr : best),
      { key: "—", value: 0 }
    );
    const topCategoryLabel = topCategoryEntry.value > 0 ? topCategoryEntry.key : "—";
    const topBadgeSource = adminBadges.length > 0 ? adminBadges : MOCK_BADGES;
    const topBadge = topBadgeSource.reduce((a, b) =>
      (a.usersEarned ?? 0) >= (b.usersEarned ?? 0) ? a : b
    );
    const topBadges = [...topBadgeSource]
      .sort((a, b) => Number(b.usersEarned || 0) - Number(a.usersEarned || 0))
      .slice(0, 3);
    const txSourceForStats = Array.isArray(adminTransactions) ? adminTransactions : [];
    const totalTransactions = txSourceForStats.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalTxCount = txSourceForStats.length;

    const goalsSource = Array.isArray(adminGoals) ? adminGoals : [];
    const totalGoals = goalsSource.length;
    const goalsActive = goalsSource.filter(
      (g) => g.status === "ACTIVE" || g.status === "Active"
    ).length;
    const avgGoalProgress =
      goalsSource.length > 0
        ? Math.round(
            goalsSource.reduce(
              (sum, g) => sum + (typeof g.progressPercentage === "number" ? g.progressPercentage : 0),
              0
            ) / goalsSource.length
          )
        : 0;

    const txSource = Array.isArray(adminTransactions) ? adminTransactions : [];
    const topItemsMap = txSource.reduce((acc, t) => {
      const name =
        t.marketplaceItem?.itemName ||
        t.itemName ||
        t.item ||
        "Marketplace Item";
      const amount = Number(t.amount || 0);
      const key = name;
      if (!acc[key]) {
        acc[key] = { name, total: 0, count: 0 };
      }
      acc[key].total += amount;
      acc[key].count += 1;
      return acc;
    }, {});
    const topItems = Object.values(topItemsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    return (
      <>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-icon">👥</span>
            <span className="admin-stat-value">{totalUsers}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🌍</span>
            <span className="admin-stat-value">{avgEmissions} kg</span>
            <span className="admin-stat-label">Avg. Emissions</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🏅</span>
            <span className="admin-stat-value">{topBadge.name}</span>
            <span className="admin-stat-label">
              Most Earned Badge ({Number(topBadge.usersEarned || 0)} users)
            </span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">💰</span>
            <span className="admin-stat-value">₹{Number(totalTransactions).toFixed(2)}</span>
            <span className="admin-stat-label">Marketplace Revenue</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🎯</span>
            <span className="admin-stat-value">{totalGoals}</span>
            <span className="admin-stat-label">Total Goals</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🧾</span>
            <span className="admin-stat-value">{totalTxCount}</span>
            <span className="admin-stat-label">Total Transactions</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🔥</span>
            <span className="admin-stat-value">
              {todaysEmissions.toFixed ? todaysEmissions.toFixed(2) : todaysEmissions} kg
            </span>
            <span className="admin-stat-label">Today&apos;s Emissions</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">⚡</span>
            <span className="admin-stat-value">{topCategoryLabel}</span>
            <span className="admin-stat-label">Top Category</span>
          </div>
        </div>

      </>
    );
  }

  // ══════════════════════════════════════════
  // 2. USER MANAGEMENT
  // ══════════════════════════════════════════
  function renderUsers() {
    const filtered = adminFilteredUsers;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminUsersPage), totalPages);
    const slice = filtered.slice(
      (page - 1) * ADMIN_PAGE_SIZE,
      page * ADMIN_PAGE_SIZE
    );
    return (
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3 className="admin-table-title">All Users ({filtered.length})</h3>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
              flexWrap: "nowrap",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", gap: 12, fontSize: 13, whiteSpace: "nowrap" }}>
              <button
                type="button"
                onClick={() => setUserFilter("all")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  fontSize: 13,
                  color:
                    userFilter === "all"
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                  fontWeight: userFilter === "all" ? 600 : 400,
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setUserFilter("active")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  fontSize: 13,
                  color:
                    userFilter === "active"
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                  fontWeight: userFilter === "active" ? 600 : 400,
                }}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setUserFilter("blocked")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  fontSize: 13,
                  color:
                    userFilter === "blocked"
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                  fontWeight: userFilter === "blocked" ? 600 : 400,
                }}
              >
                Blocked
              </button>
            </div>
            <div className="admin-search-wrap" style={{ minWidth: 0 }}>
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: 200 }}
              />
            </div>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`admin-status ${
                        u.active
                          ? "admin-status-active"
                          : "admin-status-inactive"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>{u.createdAt}</td>
                  <td>
                    <div className="admin-actions-row">
                      <button
                        className="admin-action-btn"
                        type="button"
                        title={u.active ? "Block user" : "Unblock user"}
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            navigate("/login");
                            return;
                          }
                          const headers = {
                            Authorization: `Bearer ${token}`,
                          };
                          const path = u.active ? "block" : "unblock";
                          try {
                            const res = await axios.put(
                              `${API_BASE}/users/${u.id}/${path}`,
                              {},
                              { headers }
                            );
                            const updated = res.data;
                            setAllUsers((prev) =>
                              Array.isArray(prev)
                                ? prev.map((userItem) =>
                                    userItem.id === updated.id
                                      ? updated
                                      : userItem
                                  )
                                : prev
                            );
                            fetchAuditLogs();
                          } catch (err) {
                            // ignore for now, could add toast
                          }
                        }}
                      >
                        {u.active ? "Block" : "Unblock"}
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn-danger"
                        type="button"
                        title="Delete user"
                        onClick={async () => {
                          const confirmDelete = window.confirm(
                            `Delete user ${u.name || u.email}? This cannot be undone.`
                          );
                          if (!confirmDelete) return;
                          const token = localStorage.getItem("token");
                          if (!token) {
                            navigate("/login");
                            return;
                          }
                          const headers = {
                            Authorization: `Bearer ${token}`,
                          };
                          try {
                            await axios.delete(
                              `${API_BASE}/users/${u.id}`,
                              { headers }
                            );
                            setAllUsers((prev) =>
                              Array.isArray(prev)
                                ? prev.filter((userItem) => userItem.id !== u.id)
                                : prev
                            );
                          } catch (err) {
                            // ignore for now, could add toast
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdminPaginationBar
            page={page}
            setPage={setAdminUsersPage}
            totalCount={filtered.length}
            ariaLabel="User list pages"
          />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // 3. ADMIN LOGS
  // ══════════════════════════════════════════
  function renderAdminLogs() {
    const rows = adminAuditFiltered;
    const totalPages = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminAuditPage), totalPages);
    const slice = rows.slice(
      (page - 1) * ADMIN_PAGE_SIZE,
      page * ADMIN_PAGE_SIZE
    );

    return (
      <div className="admin-table-card">
        <div className="admin-table-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h3 className="admin-table-title" style={{ margin: 0 }}>Admin Logs</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              className="admin-search-input"
              style={{ maxWidth: 190, fontSize: 13 }}
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
            >
              <option value="all">All actions</option>
              <option value="login">Logins</option>
              <option value="logout">Logouts</option>
              <option value="settings">Settings changes</option>
              <option value="marketplace">Marketplace</option>
              <option value="notification">Notifications</option>
              <option value="badge">Badges</option>
              <option value="user">User management</option>
            </select>
            <button
              type="button"
              className="admin-action-btn"
              onClick={() => fetchAuditLogs()}
              disabled={auditLogsLoading}
              title="Reload logs from the server"
            >
              {auditLogsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {auditLogsError && (
          <div className="admin-empty" style={{ borderBottom: "1px solid var(--color-border, #e5e7eb)", paddingBottom: 16 }}>
            <span className="admin-empty-icon">⚠️</span>
            <p style={{ color: "var(--color-accent-red, #c0392b)", marginBottom: 8 }}>{auditLogsError}</p>
            <button type="button" className="admin-action-btn admin-action-btn-primary" onClick={() => fetchAuditLogs()}>
              Try again
            </button>
          </div>
        )}
        {rows.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Name</th>
                  <th>Action</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((l, idx) => (
                  <tr key={l.id != null ? `audit-${l.id}` : `audit-${idx}-${l.createdAt || ""}`}>
                    <td>{l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN") : "—"}</td>
                    <td><strong>{l.adminName || "—"}</strong></td>
                    <td>{l.action}</td>
                    <td>{l.ipAddress || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPaginationBar
              page={page}
              setPage={setAdminAuditPage}
              totalCount={rows.length}
              ariaLabel="Admin log pages"
            />
          </div>
        ) : auditLogsLoading && !auditLogsError ? (
          <div className="admin-empty">
            <span className="admin-empty-icon">⏳</span>
            <p>Loading activity logs…</p>
          </div>
        ) : !auditLogsError ? (
          <div className="admin-empty">
            <span className="admin-empty-icon">📭</span>
            <p>No admin activity logs yet.</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8, maxWidth: 420 }}>
              Logs are stored when you sign in or out (admin), change settings, marketplace items, notifications, badge templates, award badges, or block/unblock users. Use Refresh after an action if the list does not update.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // CONTACT INBOX (marketing site form)
  // ══════════════════════════════════════════
  function renderContactInbox() {
    const allRows = Array.isArray(adminContactMessages) ? adminContactMessages : [];
    const formatDt = (iso) => {
      if (!iso) return "—";
      try {
        return new Date(iso).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        return String(iso);
      }
    };

    const isRowRead = (m) => m.read === true || m.messageRead === true;

    const hasStoredReply = (m) => {
      const sub = m.replySubject != null && String(m.replySubject).trim();
      const bod = m.replyBody != null && String(m.replyBody).trim();
      return Boolean(sub || bod);
    };

    function openViewReplyModal(m) {
      setContactViewReplyModal({
        toEmail: (m.email || "").trim(),
        subject: m.replySubject != null && String(m.replySubject).trim() ? String(m.replySubject).trim() : "—",
        body: m.replyBody != null && String(m.replyBody).trim() ? String(m.replyBody).trim() : "—",
      });
    }

    function closeViewReplyModal() {
      setContactViewReplyModal(null);
    }

    function openContactReplyModal(m) {
      const to = (m.email || "").trim();
      if (!to || !m.id) return;
      const orig = m.subject && String(m.subject).trim() ? String(m.subject).trim() : "";
      setContactReplyModal({ id: m.id, email: to, name: (m.name || "").trim() });
      setContactReplySubject(orig ? `Re: ${orig}` : "Re: Your CarbonCalc contact message");
      setContactReplyMessage("");
      setContactReplyError("");
    }

    function closeContactReplyModal() {
      setContactReplyModal(null);
      setContactReplySubject("");
      setContactReplyMessage("");
      setContactReplyError("");
      setContactReplySending(false);
    }

    async function submitContactReply() {
      const token = localStorage.getItem("token");
      if (!token || !contactReplyModal) return;
      const subj = contactReplySubject.trim();
      const body = contactReplyMessage.trim();
      if (!subj || !body) {
        setContactReplyError("Subject and message are required.");
        return;
      }
      setContactReplySending(true);
      setContactReplyError("");
      try {
        const res = await axios.post(
          `${API_BASE}/contact/messages/${contactReplyModal.id}/reply`,
          { subject: subj, message: body },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updated = res.data;
        setAdminContactMessages((prev) =>
          Array.isArray(prev) ? prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)) : prev
        );
        closeContactReplyModal();
      } catch (err) {
        const d = err.response?.data;
        const msg =
          (typeof d === "string" && d) ||
          d?.message ||
          err.message ||
          "Could not send reply.";
        setContactReplyError(String(msg));
      } finally {
        setContactReplySending(false);
      }
    }

    async function markContactRowRead(id) {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.patch(
          `${API_BASE}/contact/messages/${id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updated = res.data;
        setAdminContactMessages((prev) =>
          Array.isArray(prev) ? prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)) : prev
        );
      } catch {
        /* ignore */
      }
    }

    let rows = [...allRows];
    if (contactInboxReadFilter === "unread") {
      rows = rows.filter((m) => !isRowRead(m));
    } else if (contactInboxReadFilter === "read") {
      rows = rows.filter((m) => isRowRead(m));
    }
    const q = contactInboxSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((m) => {
        const blob = [
          m.name,
          m.email,
          m.subject,
          m.message,
          m.createdAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    const totalCount = allRows.length;
    const shownCount = rows.length;
    const filtersActive = contactInboxSearch.trim() || contactInboxReadFilter !== "all";

    return (
      <>
        <div className="admin-table-card">
          {contactInboxLoadError ? (
            <div
              className="admin-notif-alert"
              role="alert"
              style={{ margin: "12px 16px 0", fontSize: 14 }}
            >
              {contactInboxLoadError}{" "}
              <span style={{ color: "var(--color-text-muted)" }}>
                If the database was created before the contact inbox feature, restart the API so Hibernate can add the
                missing column, or run{" "}
                <code style={{ fontSize: 12 }}>db_scripts/migrate_to_current_schema.sql</code>.
              </span>
            </div>
          ) : null}
          <div
            className="admin-table-header"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <h3 className="admin-table-title" style={{ margin: 0 }}>
              Contact
            </h3>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {shownCount === totalCount
                ? `${totalCount} message${totalCount === 1 ? "" : "s"} · newest first`
                : `${shownCount} shown of ${totalCount} · newest first`}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <input
              id="contact-inbox-search"
              type="search"
              className="admin-search-input"
              placeholder="Search name, email, subject, message…"
              aria-label="Search contact messages"
              value={contactInboxSearch}
              onChange={(e) => setContactInboxSearch(e.target.value)}
              style={{ minWidth: 220, flex: "1 1 200px", maxWidth: 420 }}
            />
            <label htmlFor="contact-inbox-read-filter" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Status
            </label>
            <select
              id="contact-inbox-read-filter"
              className="admin-search-input"
              style={{ maxWidth: 160, fontSize: 13 }}
              value={contactInboxReadFilter}
              onChange={(e) => setContactInboxReadFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            {filtersActive && (
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => {
                  setContactInboxSearch("");
                  setContactInboxReadFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {totalCount === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px 16px", color: "var(--color-text-muted)" }}>
                      No contact messages yet. Visitors can submit from the marketing site Contact page.
                    </td>
                  </tr>
                ) : shownCount === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px 16px", color: "var(--color-text-muted)" }}>
                      No messages match your filters. Try clearing search or changing filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((m, idx) => (
                    <tr key={m.id != null ? m.id : `contact-${idx}`}>
                      <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{formatDt(m.createdAt)}</td>
                      <td style={{ fontSize: 12 }}>
                        {isRowRead(m) ? (
                          <span style={{ color: "var(--color-text-muted)" }}>Read</span>
                        ) : (
                          <span style={{ fontWeight: 700, color: "var(--color-accent-red)" }}>Unread</span>
                        )}
                      </td>
                      <td>
                        <strong>{m.name || "—"}</strong>
                      </td>
                      <td>
                        {m.email ? (
                          <a href={`mailto:${m.email}`}>{m.email}</a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ maxWidth: 180 }}>{m.subject || "—"}</td>
                      <td style={{ maxWidth: 360, fontSize: 13, lineHeight: 1.45, wordBreak: "break-word" }}>
                        {m.message || "—"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {m.email && m.id != null ? (
                          !isRowRead(m) ? (
                            <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                              <button type="button" className="admin-action-btn" onClick={() => openContactReplyModal(m)}>
                                Reply
                              </button>
                              <button type="button" className="admin-action-btn" onClick={() => markContactRowRead(m.id)}>
                                Mark read
                              </button>
                            </span>
                          ) : hasStoredReply(m) ? (
                            <button type="button" className="admin-action-btn" onClick={() => openViewReplyModal(m)}>
                              View reply
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>—</span>
                          )
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {contactReplyModal ? (
          <div
            className="admin-notif-modal-overlay"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && !contactReplySending) closeContactReplyModal();
            }}
          >
            <div className="admin-notif-modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true" aria-labelledby="contact-reply-title">
              <div className="admin-notif-modal-head">
                <h3 id="contact-reply-title" className="admin-notif-modal-title">
                  Reply by email
                </h3>
                <button
                  type="button"
                  className="admin-notif-modal-close"
                  aria-label="Close"
                  disabled={contactReplySending}
                  onClick={closeContactReplyModal}
                >
                  ×
                </button>
              </div>
              <div className="admin-notif-form">
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="contact-reply-to">
                    To
                  </label>
                  <input
                    id="contact-reply-to"
                    type="email"
                    className="admin-notif-input"
                    readOnly
                    value={contactReplyModal.email}
                  />
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="contact-reply-subject">
                    Subject <span style={{ color: "var(--color-accent-red)" }}>*</span>
                  </label>
                  <input
                    id="contact-reply-subject"
                    type="text"
                    className="admin-notif-input"
                    value={contactReplySubject}
                    onChange={(e) => setContactReplySubject(e.target.value)}
                    placeholder="Email subject line"
                    disabled={contactReplySending}
                  />
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="contact-reply-body">
                    Message <span style={{ color: "var(--color-accent-red)" }}>*</span>
                  </label>
                  <textarea
                    id="contact-reply-body"
                    className="admin-notif-input"
                    rows={8}
                    value={contactReplyMessage}
                    onChange={(e) => setContactReplyMessage(e.target.value)}
                    placeholder={`Write your reply to ${contactReplyModal.name || "the visitor"}…`}
                    disabled={contactReplySending}
                    style={{ minHeight: 160, resize: "vertical" }}
                  />
                </div>
                {contactReplyError ? (
                  <p className="admin-notif-alert admin-notif-alert--in-form" style={{ marginBottom: 12 }}>
                    {contactReplyError}
                  </p>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" className="admin-action-btn" disabled={contactReplySending} onClick={closeContactReplyModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" disabled={contactReplySending} onClick={submitContactReply}>
                    {contactReplySending ? "Sending…" : "Send email"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {contactViewReplyModal ? (
          <div
            className="admin-notif-modal-overlay"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeViewReplyModal();
            }}
          >
            <div
              className="admin-notif-modal"
              style={{ maxWidth: 520 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-view-reply-title"
            >
              <div className="admin-notif-modal-head">
                <h3 id="contact-view-reply-title" className="admin-notif-modal-title">
                  Sent reply
                </h3>
                <button type="button" className="admin-notif-modal-close" aria-label="Close" onClick={closeViewReplyModal}>
                  ×
                </button>
              </div>
              <div className="admin-notif-form">
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="contact-view-reply-to">
                    To
                  </label>
                  <input
                    id="contact-view-reply-to"
                    type="email"
                    className="admin-notif-input"
                    readOnly
                    value={contactViewReplyModal.toEmail}
                  />
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="contact-view-reply-subject">
                    Subject
                  </label>
                  <input
                    id="contact-view-reply-subject"
                    type="text"
                    className="admin-notif-input"
                    readOnly
                    value={contactViewReplyModal.subject}
                  />
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="contact-view-reply-body">
                    Message
                  </label>
                  <textarea
                    id="contact-view-reply-body"
                    className="admin-notif-input"
                    readOnly
                    rows={10}
                    value={contactViewReplyModal.body}
                    style={{ minHeight: 200, resize: "vertical" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-primary" onClick={closeViewReplyModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  // ══════════════════════════════════════════
  // 4. GOAL MONITORING
  // ══════════════════════════════════════════
  function renderGoals() {
    const source = Array.isArray(adminGoals) ? [...adminGoals] : [];
    source.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return (b.id || 0) - (a.id || 0);
    });
    const rows = source.map((g, idx) => ({
      id: g.id != null ? g.id : `goal-row-${idx}`,
      userId: g.userId,
      user: g.userName || g.user?.name || (g.userId != null ? `User #${g.userId}` : "—"),
      title: g.goalTitle || g.title || g.name || "—",
      category: g.category,
      timeframe: g.timeframe,
      startDate: g.startDate,
      endDate: g.endDate,
      progress: typeof g.progressPercentage === "number" ? g.progressPercentage : null,
      status: g.status || "ACTIVE",
      createdAt: g.createdAt,
    }));
    const categoryKeys = [
      ...new Set(
        rows
          .map((g) => (g.category != null && String(g.category).trim() !== "" ? String(g.category).toLowerCase() : null))
          .filter(Boolean)
      ),
    ].sort();
    const filteredRows = rows.filter((g) => {
      const statusUpper = String(g.status || "").toUpperCase();
      if (adminGoalsStatusFilter !== "all") {
        if (adminGoalsStatusFilter === "active" && statusUpper !== "ACTIVE") return false;
        if (adminGoalsStatusFilter === "completed" && statusUpper !== "COMPLETED") return false;
        if (adminGoalsStatusFilter === "expired" && statusUpper !== "EXPIRED") return false;
      }
      if (adminGoalsCategoryFilter !== "all") {
        const c = String(g.category || "").toLowerCase();
        if (c !== adminGoalsCategoryFilter.toLowerCase()) return false;
      }
      return true;
    });
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminGoalsPage), totalPages);
    const slice = filteredRows.slice(
      (page - 1) * ADMIN_PAGE_SIZE,
      page * ADMIN_PAGE_SIZE
    );

    return (
      <div className="admin-table-card">
        <div className="admin-table-header admin-goals-table-header">
          <h3 className="admin-table-title" style={{ margin: 0 }}>
            Goal monitoring
          </h3>
          <div className="admin-goals-header-actions">
            <select
              className="admin-search-input admin-goal-filter-select"
              value={adminGoalsStatusFilter}
              onChange={(e) => setAdminGoalsStatusFilter(e.target.value)}
              aria-label="Filter by goal status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
            <select
              className="admin-search-input admin-goal-filter-select"
              value={adminGoalsCategoryFilter}
              onChange={(e) => setAdminGoalsCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categoryKeys.map((key) => (
                <option key={key} value={key}>
                  {formatAdminGoalCategory(key)}
                </option>
              ))}
            </select>
            <span className="admin-goals-header-meta">
              {filteredRows.length} of {rows.length} goal{rows.length === 1 ? "" : "s"}
              {rows.length > 0 ? " · non-admin users · newest first" : ""}
            </span>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Goal</th>
                <th>Category</th>
                <th>Timeframe</th>
                <th>Period</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "20px 16px", color: "var(--color-text-muted)" }}>
                    No goals from non-admin users yet.
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "20px 16px", color: "var(--color-text-muted)" }}>
                    No goals match the selected filters.
                  </td>
                </tr>
              ) : (
                slice.map((g) => {
                  const statusUpper = String(g.status || "").toUpperCase();
                  const isCompleted = statusUpper === "COMPLETED";
                  const isExpired = statusUpper === "EXPIRED";
                  const isActive = statusUpper === "ACTIVE";
                  const rawPct = parseAdminGoalProgress(g.progress, isCompleted);
                  const progressBar = Math.max(0, Math.min(100, rawPct));
                  const progressLabel = formatAdminGoalProgressLabel(rawPct);
                  let statusClass = "admin-status-pending";
                  if (isCompleted) statusClass = "admin-status-completed";
                  else if (isExpired) statusClass = "admin-status-expired";
                  else if (isActive) statusClass = "admin-status-active";
                  return (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.user}</strong>
                        {g.userId != null && (
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            ID {g.userId}
                          </div>
                        )}
                      </td>
                      <td>{g.title}</td>
                      <td>{formatAdminGoalCategory(g.category)}</td>
                      <td>{formatAdminGoalTimeframe(g.timeframe)}</td>
                      <td>{adminGoalPeriodLabel(g.startDate, g.endDate)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 80,
                              height: 8,
                              background: "var(--color-border)",
                              borderRadius: 999,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${progressBar}%`,
                                height: "100%",
                                background: isCompleted
                                  ? "var(--color-accent-green)"
                                  : isExpired
                                    ? "var(--color-text-muted)"
                                    : "linear-gradient(90deg, var(--color-primary), var(--color-accent-green))",
                                borderRadius: 999,
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                            {progressLabel}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status ${statusClass}`}>{statusUpper}</span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {formatAdminGoalDate(g.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminPaginationBar
          page={page}
          setPage={setAdminGoalsPage}
          totalCount={filteredRows.length}
          ariaLabel="Goal monitoring pages"
        />
      </div>
    );
  }

  // ══════════════════════════════════════════
  // 5. BADGE MANAGEMENT
  // ══════════════════════════════════════════
  function renderBadges() {

    const resolveBadgeIcon = (tpl) => {
      const code = tpl.code || "";
      switch (code) {
        case "FIRST_LOG": return "📊";
        case "WEEK_WARRIOR": return "📅";
        case "LOW_EMITTER": return "🍃";
        case "ECO_STREAK": return "🔥";
        case "SURVEY_MASTER": return "📋";
        case "CARBON_CUTTER": return "✂️";
        case "GREEN_CHAMPION": return "🏆";
        case "TREE_PLANTER": return "🌳";
        case "SOLAR_HERO": return "☀️";
        case "TEAM_PLAYER": return "🤝";
        case "GOAL_SETTER": return "🎯";
        case "GOAL_ACHIEVER": return "✅";
        case "ECO_STARTER": return "🌱";
        case "GREEN_ACHIEVER": return "🏆";
        case "CARBON_SAVER": return "✂️";
        case "NIGHT_LOGGER": return "🌙";
        case "PUBLIC_TRANSPORT_PRO": return "🚆";
        case "PLANT_BASED_HERO": return "🥦";
        case "ENERGY_SAVER": return "💡";
        case "WEEKLY_CHECKIN": return "📆";
        case "CONSISTENCY_KING": return "👑";
        case "COMMUNITY_LEADER": return "🤝";
        default:
          if (tpl.icon && tpl.icon !== "??") return tpl.icon;
          return "🏅";
      }
    };

    const normalizedUsers = allUsers
      // do not show admins in award-badge user list
      .filter((u) => {
        const role = (u.role || u.userRole || "").toString().toLowerCase();
        return role !== "admin";
      })
      .map((u) => ({
        id: u.id,
        name: u.name || u.email || `User #${u.id}`,
        email: u.email || "",
        role: u.role || "",
      }));

    const baseBadges =
      badgeTemplates.length > 0 ? badgeTemplates : adminBadges;

    const totalBadges = baseBadges.length;
    const activeBadges = baseBadges.filter((b) => b.active ?? true).length;
    const disabledBadges = totalBadges - activeBadges;

    const displayBadges = adminFilteredBadges.slice(
      (adminBadgesPage - 1) * ADMIN_PAGE_SIZE,
      adminBadgesPage * ADMIN_PAGE_SIZE
    );

    const matchingUsers = badgeUserQuery
      ? normalizedUsers.filter((u) => {
          const q = badgeUserQuery.toLowerCase();
          return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            String(u.id).includes(q)
          );
        })
      : normalizedUsers.slice(0, 5);

    const handleSelectUser = (user) => {
      setSelectedBadgeUser(user);
      setBadgeMessage("");
    };

    const handleAddSelectedUser = () => {
      if (!selectedBadgeUser) {
        return;
      }
      if (String(selectedBadgeUser.id) === ALL_USERS_OPTION_ID) {
        setSelectedUserIds(normalizedUsers.map((u) => u.id));
        setBadgeMessage("");
        return;
      }
      setSelectedUserIds((prev) =>
        prev.includes(selectedBadgeUser.id)
          ? prev
          : [...prev, selectedBadgeUser.id]
      );
      setBadgeMessage("");
    };

    const handleRemoveSelectedUser = (id) => {
      setSelectedUserIds((prev) => prev.filter((uId) => uId !== id));
    };

    const startEditTemplate = (tpl) => {
      setBadgeEditId(tpl.id);
      setBadgeEditDraft({
        name: tpl.name || "",
        conditionText: tpl.conditionText || tpl.description || "",
        icon: tpl.icon || "",
        active: tpl.active ?? true,
      });
      setBadgeMessage("");
    };

    const cancelEditTemplate = () => {
      setBadgeEditId(null);
    };

    const saveTemplate = async (tpl) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setBadgeSavingId(tpl.id);
        const headers = { Authorization: `Bearer ${token}` };
        const payload = {
          ...tpl,
          name: badgeEditDraft.name || tpl.name,
          conditionText: badgeEditDraft.conditionText || tpl.conditionText,
          icon: badgeEditDraft.icon || tpl.icon,
          active:
            typeof badgeEditDraft.active === "boolean"
              ? badgeEditDraft.active
              : tpl.active,
        };
        const res = await axios.put(
          `${API_BASE}/badge-templates/${tpl.id}`,
          payload,
          { headers }
        );
        const updated = res.data;
        setBadgeTemplates((prev) =>
          Array.isArray(prev)
            ? prev.map((b) => (b.id === updated.id ? updated : b))
            : prev
        );
        setBadgeMessage("Badge template updated successfully.");
        fetchAuditLogs();
        setBadgeEditId(null);
      } catch (err) {
        setBadgeMessage(
          "Failed to update badge template. Please try again."
        );
      } finally {
        setBadgeSavingId(null);
      }
    };

    const toggleTemplateActive = async (tpl) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        setBadgeSavingId(tpl.id);
        const headers = { Authorization: `Bearer ${token}` };
        const payload = {
          ...tpl,
          active: !tpl.active,
        };
        const res = await axios.put(
          `${API_BASE}/badge-templates/${tpl.id}`,
          payload,
          { headers }
        );
        const updated = res.data;
        setBadgeTemplates((prev) =>
          Array.isArray(prev)
            ? prev.map((b) => (b.id === updated.id ? updated : b))
            : prev
        );
        setBadgeMessage(
          updated.active
            ? "Badge has been enabled."
            : "Badge has been disabled."
        );
        fetchAuditLogs();
      } catch (err) {
        setBadgeMessage(
          "Failed to change badge status. Please try again."
        );
      } finally {
        setBadgeSavingId(null);
      }
    };

    const handleAwardBadge = async (e) => {
      e.preventDefault();
      setBadgeMessage("");

      const targetIds = selectedUserIds;

      if (!targetIds.length || !badgeSelectedTemplateId) {
        setBadgeMessage("Please add at least one user and select a badge.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setBadgeSubmitting(true);
        const headers = { Authorization: `Bearer ${token}` };
        for (const id of targetIds) {
          await axios.post(
            `${API_BASE}/badges/award/${id}`,
            {
              badgeName: badgeForm.badgeName,
              description: badgeForm.description || undefined,
            },
            { headers }
          );
        }
        setBadgeMessage(
          `Badge awarded to ${targetIds.length} user${targetIds.length > 1 ? "s" : ""}.`
        );
        fetchAuditLogs();
        // Optionally refetch admin badges so the new one appears
        const bRes = await axios.get(`${API_BASE}/badges`, { headers });
        const earned = Array.isArray(bRes.data) ? bRes.data : [];
        if (earned.length > 0) {
          const mapped = earned.map((b, index) => ({
            id: b.id || index + 1,
            name: b.badgeName || b.name || `Badge ${index + 1}`,
            icon: "🏅",
            condition: b.description || "Assigned badge",
            active: true,
            usersEarned: 1,
          }));
          setAdminBadges(mapped);
        }
        setBadgeForm({
          userId: "",
          badgeName: "",
          description: "",
        });
        setSelectedBadgeUser(null);
        setSelectedUserIds([]);
        setBadgeSelectedTemplateId("");
      } catch (err) {
        if (err.response && (err.response.status === 400 || err.response.status === 409)) {
          const msg = String(err.response.data || "").toLowerCase();
          if (msg.includes("already") || msg.includes("duplicate")) {
            setBadgeMessage("This badge has already been awarded to one or more selected users.");
          } else {
            setBadgeMessage(err.response.data || "Failed to award badge. Please verify the details and try again.");
          }
        } else {
          setBadgeMessage(
            "Failed to award badge. Please verify the details and try again."
          );
        }
      } finally {
        setBadgeSubmitting(false);
      }
    };

    return (
      <>
        {showCreateTemplateForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: 16,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "var(--color-surface)",
                borderRadius: 18,
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                padding: 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 className="admin-table-title" style={{ margin: 0 }}>
                  {editingTemplateId ? "Edit Badge" : "Create Badge"}
                </h3>
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn-danger"
                  onClick={() => setShowCreateTemplateForm(false)}
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={handleCreateTemplate}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                  Name
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="e.g. Eco Starter"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  style={{ marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                  Short Description
                </label>
                <textarea
                  className="admin-textarea"
                  placeholder="User-facing description"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      description: e.target.value,
                    })
                  }
                  style={{ marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                  Condition
                </label>
                <textarea
                  className="admin-textarea"
                  placeholder="How to earn this badge"
                  value={newTemplate.conditionText}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      conditionText: e.target.value,
                    })
                  }
                  style={{ marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                  Icon (Emoji)
                </label>
                <select
                  className="admin-search-input admin-badge-icon-select"
                  value={newTemplate.icon}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, icon: e.target.value })
                  }
                  style={{ marginTop: 4 }}
                >
                  <option value="">Select logo</option>
                  {BADGE_ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 6, display: "flex", alignItems: "center" }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newTemplate.active}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        active: e.target.checked,
                      })
                    }
                    style={{ margin: 0 }}
                  />
                  <span>Active</span>
                </label>
              </div>

              <button
                type="submit"
                className="admin-action-btn admin-action-btn-primary"
                disabled={creatingTemplate}
                style={{ marginTop: 6, alignSelf: "stretch" }}
              >
                {creatingTemplate
                  ? editingTemplateId
                    ? "Saving..."
                    : "Creating..."
                  : editingTemplateId
                  ? "Save Changes"
                  : "Create Badge"}
              </button>
              {badgeMessage && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: badgeMessage.toLowerCase().includes("success")
                      ? "var(--color-accent-green)"
                      : "var(--color-accent-red)",
                  }}
                >
                  {badgeMessage}
                </p>
              )}
            </form>
          </div>
        </div>
        )}

        <div className="admin-table-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="admin-actions-row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h3 className="admin-table-title">
                Badge Templates {totalBadges > 0 && `(${totalBadges})`}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                Manage the catalog of badges that users can earn.
              </p>
            </div>
            <div className="admin-actions-row" style={{ gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                <button
                  type="button"
                  onClick={() => setBadgeFilter("all")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    color:
                      badgeFilter === "all"
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                    fontWeight: badgeFilter === "all" ? 600 : 400,
                  }}
                >
                  All badges
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter("active")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    color:
                      badgeFilter === "active"
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                    fontWeight: badgeFilter === "active" ? 600 : 400,
                  }}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter("disabled")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    color:
                      badgeFilter === "disabled"
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                    fontWeight: badgeFilter === "disabled" ? 600 : 400,
                  }}
                >
                  Disabled
                </button>
              </div>
              <button
              type="button"
              className="admin-action-btn admin-action-btn-primary"
              onClick={() => {
                setEditingTemplateId(null);
                setNewTemplate({
                  name: "",
                  description: "",
                  conditionText: "",
                  icon: "",
                  active: true,
                });
                setShowCreateTemplateForm((open) => !open);
              }}
            >
              {showCreateTemplateForm ? "Close" : "+ Create Badge"}
            </button>
            </div>
          </div>
        </div>


        <div className="admin-table-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="admin-actions-row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h3 className="admin-table-title">Award Badge</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                Choose a user and a badge, then award it with a single click.
              </p>
            </div>
            <button
              type="button"
              className="admin-action-btn admin-action-btn-primary"
              onClick={() => setShowAwardForm((v) => !v)}
            >
              {showAwardForm ? "Close" : "Open Form"}
            </button>
          </div>
        </div>

        {showAwardForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: 16,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "var(--color-surface)",
                borderRadius: 18,
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                padding: 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 className="admin-table-title" style={{ margin: 0 }}>
                  Award Badge
                </h3>
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn-danger"
                  onClick={() => setShowAwardForm(false)}
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleAwardBadge}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                    User
                  </label>
                  <select
                    className="admin-search-input"
                    style={{ marginTop: 4 }}
                    value={selectedBadgeUser ? String(selectedBadgeUser.id) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setSelectedBadgeUser(null);
                        setBadgeForm({ ...badgeForm, userId: "" });
                        return;
                      }
                      if (value === ALL_USERS_OPTION_ID) {
                        handleSelectUser({
                          id: ALL_USERS_OPTION_ID,
                          name: "All users",
                          email: "",
                          role: "",
                        });
                        return;
                      }
                      const found = normalizedUsers.find(
                        (u) => String(u.id) === String(value)
                      );
                      if (found) {
                        handleSelectUser(found);
                      }
                    }}
                  >
                    <option value="">Select user</option>
                    <option value={ALL_USERS_OPTION_ID}>All users</option>
                    {normalizedUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email || "no email"}) · ID {u.id}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="admin-action-btn admin-action-btn-primary"
                  onClick={handleAddSelectedUser}
                  style={{ marginTop: 8 }}
                >
                  Add User
                </button>

                <div
                  style={{
                    marginTop: 8,
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: 8,
                    minHeight: 36,
                    maxHeight: 120,
                    overflowY: "auto",
                    background: "var(--color-surface)",
                  }}
                >
                  {selectedUserIds.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      No users added yet. Use the select above and click <strong>Add User</strong>.
                    </span>
                  ) : selectedUserIds.length === normalizedUsers.length ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "var(--color-primary-soft)",
                        color: "var(--color-text)",
                        fontSize: 12,
                        margin: "2px 4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      All users ({normalizedUsers.length})
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds([])}
                        style={{
                          marginLeft: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "var(--color-text-muted)",
                          fontSize: 12,
                        }}
                        aria-label="Remove all users"
                      >
                        ✕
                      </button>
                    </span>
                  ) : (
                    selectedUserIds.map((id) => {
                      const u = normalizedUsers.find((user) => user.id === id);
                      if (!u) return null;
                      return (
                        <span
                          key={id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "var(--color-primary-soft)",
                            color: "var(--color-text)",
                            fontSize: 12,
                            margin: "2px 4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.name}{" "}
                          <span
                            onClick={() => handleRemoveSelectedUser(id)}
                            style={{
                              marginLeft: 6,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            ×
                          </span>
                        </span>
                      );
                    })
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Badge
                  </label>
                  {badgeTemplates.length > 0 && (
                    <select
                      className="admin-search-input admin-badge-icon-select"
                      style={{ marginTop: 4 }}
                      value={badgeSelectedTemplateId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBadgeSelectedTemplateId(value);
                        const tpl = badgeTemplates.find(
                          (t) => String(t.id) === String(value)
                        );
                        if (tpl) {
                          setBadgeForm((prev) => ({
                            ...prev,
                            badgeName: tpl.name || prev.badgeName,
                            description:
                              tpl.description ||
                              tpl.conditionText ||
                              prev.description,
                          }));
                        }
                      }}
                    >
                      <option value="">Select badge template</option>
                      {badgeTemplates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  className="admin-action-btn admin-action-btn-primary"
                  disabled={badgeSubmitting}
                  style={{ marginTop: 8, alignSelf: "stretch" }}
                >
                  {badgeSubmitting ? "Awarding..." : "Award Badge"}
                </button>
                {badgeMessage && (
                  <p
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: badgeMessage.toLowerCase().includes("awarded")
                        ? "var(--color-accent-green)"
                        : "var(--color-accent-red)",
                    }}
                  >
                    {badgeMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
        <div className="admin-badge-grid">
          {displayBadges.map((b) => {
            const isTemplate = typeof b.conditionText !== "undefined";
            const name = b.name;
            const condition = isTemplate
              ? b.conditionText || b.description || "No condition specified"
              : b.condition;
            const active = b.active ?? true;
            const icon = resolveBadgeIcon(b);
            const isEditing = badgeEditId === b.id && isTemplate;
            return (
              <div className="admin-badge-card" key={b.id}>
                <span className="admin-badge-card-status">
                  <span
                    className={`admin-status ${
                      active ? "admin-status-active" : "admin-status-inactive"
                    }`}
                  >
                    {active ? "Active" : "Disabled"}
                  </span>
                </span>
                <span className="admin-badge-card-icon">{icon}</span>
                {isEditing ? (
                  <div style={{ width: "100%", marginTop: 6 }}>
                    <input
                      type="text"
                      className="admin-search-input"
                      style={{ marginBottom: 6 }}
                      placeholder="Badge name"
                      value={badgeEditDraft.name}
                      onChange={(e) =>
                        setBadgeEditDraft({
                          ...badgeEditDraft,
                          name: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      className="admin-search-input"
                      style={{ marginBottom: 6 }}
                      placeholder="Condition / description"
                      value={badgeEditDraft.conditionText}
                      onChange={(e) =>
                        setBadgeEditDraft({
                          ...badgeEditDraft,
                          conditionText: e.target.value,
                        })
                      }
                    />
                    <select
                      className="admin-search-input"
                      style={{ marginBottom: 6 }}
                      aria-label="Badge logo"
                      value={badgeEditDraft.icon}
                      onChange={(e) =>
                        setBadgeEditDraft({
                          ...badgeEditDraft,
                          icon: e.target.value,
                        })
                      }
                    >
                      <option value="">Select logo</option>
                      {BADGE_ICON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={badgeEditDraft.active}
                        onChange={(e) =>
                          setBadgeEditDraft({
                            ...badgeEditDraft,
                            active: e.target.checked,
                          })
                        }
                      />
                      Active
                    </label>
                    <div className="admin-actions-row">
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn-primary"
                        onClick={() => saveTemplate(b)}
                        disabled={badgeSavingId === b.id}
                      >
                        {badgeSavingId === b.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn-danger"
                        onClick={cancelEditTemplate}
                        disabled={badgeSavingId === b.id}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="admin-badge-card-name">{name}</div>
                    <div className="admin-badge-card-condition">{condition}</div>
                    <div className="admin-actions-row">
                      <button
                        type="button"
                        className="admin-action-btn"
                        disabled={!isTemplate}
                        onClick={() => {
                          if (!isTemplate) return;
                          setEditingTemplateId(b.id);
                          setNewTemplate({
                            name: b.name || "",
                            description: b.description || b.conditionText || "",
                            conditionText: b.conditionText || b.description || "",
                            // Use resolved emoji icon so DB "??" is not shown
                            icon: resolveBadgeIcon(b),
                            active: b.active ?? true,
                          });
                          setShowCreateTemplateForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn-danger"
                        disabled={!isTemplate || badgeSavingId === b.id}
                        onClick={() =>
                          isTemplate ? toggleTemplateActive(b) : null
                        }
                      >
                        {active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <AdminPaginationBar
          page={adminBadgesPage}
          setPage={setAdminBadgesPage}
          totalCount={adminFilteredBadges.length}
          ariaLabel="Badge template pages"
        />
      </>
    );
  }

  // ══════════════════════════════════════════
  // 6. LEADERBOARD MANAGEMENT
  // ══════════════════════════════════════════
  function renderLeaderboard() {
    const leaderboardRows =
      adminLeaderboardFilter === "live"
        ? (adminLeaderboard.length ? adminLeaderboard : adminWeeklyLeaderboard)
        : adminWeeklyLeaderboard;
    const totalPages = Math.max(1, Math.ceil(leaderboardRows.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminLeaderboardPage), totalPages);
    const paginatedRows = leaderboardRows.slice(
      (page - 1) * ADMIN_PAGE_SIZE,
      page * ADMIN_PAGE_SIZE
    );

    return (
      <>
        <div className="admin-formula-card">
          <div className="admin-formula-label">Scoring Formula</div>
          <p className="admin-formula-text">
            Score = (Sum of carbon offset from successful purchases × 50) + (Goals completed × 20) + (Badges earned × 10)
          </p>
        </div>
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">
              Leaderboard Rankings
              {adminLeaderboardFilter === "last-week"
                ? " (Last Week)"
                : ""}
            </h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                className="admin-search-input"
                style={{ minWidth: 180 }}
                value={adminLeaderboardFilter}
                onChange={(e) => setAdminLeaderboardFilter(e.target.value)}
              >
                <option value="live">Live leaderboard</option>
                <option value="last-week">Last week</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Carbon offset purchased</th>
                  <th>Goals completed</th>
                  <th>Badges earned</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((entry) => (
                  <tr key={entry.rank}>
                    <td>
                      <strong style={{
                        color: entry.rank <= 3 ? "var(--color-primary)" : "var(--color-text)",
                        fontSize: entry.rank <= 3 ? 16 : 14,
                      }}>
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                      </strong>
                    </td>
                    <td><strong>{entry.user}</strong></td>
                    <td>{Number(entry.totalCarbonOffsetPurchased).toFixed(2)}</td>
                    <td>{entry.goalsCompleted}</td>
                    <td>{entry.badgesEarned}</td>
                    <td>
                      <strong style={{ color: "var(--color-primary)", fontSize: 16 }}>
                        {Number(entry.score).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPaginationBar
            page={page}
            setPage={setAdminLeaderboardPage}
            totalCount={leaderboardRows.length}
            ariaLabel="Leaderboard pages"
          />
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════
  // 7. ECO MARKETPLACE MANAGEMENT
  // ══════════════════════════════════════════
  function renderMarketplace() {
    const rows = (Array.isArray(adminMarketplaceItems) ? adminMarketplaceItems : []).map((item, idx) => ({
      id: item.id || idx + 1,
      name: item.itemName || item.name || "Untitled Item",
      type: normalizeMarketplaceCategory(item.itemType || item.type || "General"),
      price: Number(item.price || 0),
      desc: item.description || item.desc || "No description provided.",
      carbonOffset: item.carbonOffsetValue ?? item.carbonOffset ?? null,
      badge: item.badge || null,
      priceUnit: item.priceUnit || "unit",
      headerIcon: item.headerIcon || null,
    }));
    const categoryMeta = {
      "Carbon Offset": "🌳",
      "Renewable Energy": "☀️",
      Environmental: "🌍",
      "Sustainable Living": "♻️",
    };
    const categories = ["All", ...marketplaceAdminCategories];
    const categoryCounts = rows.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
    const filteredRows = (() => {
      let result = [...rows];
      if (adminMarketplaceCategory !== "All") {
        result = result.filter((item) => item.type === adminMarketplaceCategory);
      }
      if (adminMarketplaceSearch.trim()) {
        const q = adminMarketplaceSearch.toLowerCase();
        result = result.filter((item) =>
          item.name.toLowerCase().includes(q) ||
          (item.desc || "").toLowerCase().includes(q) ||
          (item.type || "").toLowerCase().includes(q)
        );
      }
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
      return result;
    })();
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / 3));
    const page = Math.min(Math.max(1, adminMarketplacePage), totalPages);
    const paginatedRows = filteredRows.slice(
      (page - 1) * 3,
      page * 3
    );
    const categoryBannerClass = {
      "Carbon Offset": "carbon-offset",
      "Renewable Energy": "renewable-energy",
      Environmental: "environmental",
      "Sustainable Living": "sustainable-living",
    };

    return (
      <>
        <div className="admin-table-card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="admin-actions-row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3 className="admin-table-title">Marketplace Catalog ({rows.length})</h3>
            <button
              type="button"
              className="admin-action-btn admin-action-btn-primary"
              onClick={() => {
                setEditingMarketplaceId(null);
                setMarketplaceDraft({
                  itemName: "",
                  itemType: "Carbon Offset",
                  price: "",
                  description: "",
                  carbonOffsetValue: "",
                });
                setMarketplaceMessage("");
                setShowMarketplaceForm(true);
              }}
            >
              + Add Item
            </button>
          </div>
          {marketplaceMessage && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: marketplaceMessage.toLowerCase().includes("failed") ? "var(--color-accent-red)" : "var(--color-accent-green)" }}>
              {marketplaceMessage}
            </p>
          )}
        </div>
        <div className="admin-table-card admin-marketplace-filters-card">
          <div className="admin-marketplace-filters-row">
            <input
              className="admin-search-input admin-marketplace-filter-search"
              type="text"
              placeholder="Search marketplace items..."
              value={adminMarketplaceSearch}
              onChange={(e) => setAdminMarketplaceSearch(e.target.value)}
            />
            <div className="admin-marketplace-filter-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`admin-notif-filter-chip ${adminMarketplaceCategory === cat ? "active" : ""}`}
                  onClick={() => setAdminMarketplaceCategory(cat)}
                >
                  {cat !== "All" ? `${categoryMeta[cat] || "🛒"} ` : ""}
                  {cat} ({cat === "All" ? rows.length : (categoryCounts[cat] || 0)})
                </button>
              ))}
            </div>
          </div>
        </div>

        {showMarketplaceForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
            <div style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", background: "var(--color-surface)", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 className="admin-table-title" style={{ margin: 0 }}>
                  {editingMarketplaceId ? "Edit Marketplace Item" : "Create Marketplace Item"}
                </h3>
                <button type="button" className="admin-action-btn admin-action-btn-danger" onClick={() => setShowMarketplaceForm(false)}>✕</button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem("token");
                  if (!token) {
                    navigate("/login");
                    return;
                  }
                  if (!marketplaceDraft.itemName || !marketplaceDraft.price) {
                    setMarketplaceMessage("Item name and price are required.");
                    return;
                  }
                  setMarketplaceSubmitting(true);
                  setMarketplaceMessage("");
                  try {
                    const headers = { Authorization: `Bearer ${token}` };
                    const payload = {
                      itemName: marketplaceDraft.itemName,
                      itemType: marketplaceDraft.itemType || "Carbon Offset",
                      price: Number(marketplaceDraft.price),
                      description: marketplaceDraft.description,
                      carbonOffsetValue: marketplaceDraft.carbonOffsetValue === ""
                        ? null
                        : Number(marketplaceDraft.carbonOffsetValue),
                      badge: null,
                      impactProgressPercent: null,
                      priceUnit: "unit",
                      headerIcon: null,
                      bannerKey: getMarketplaceBannerFromCategory(marketplaceDraft.itemType),
                    };
                    if (editingMarketplaceId) {
                      const res = await axios.put(`${API_BASE}/marketplace/${editingMarketplaceId}`, payload, { headers });
                      const updated = res.data;
                      setAdminMarketplaceItems((prev) =>
                        Array.isArray(prev) ? prev.map((i) => (i.id === updated.id ? updated : i)) : [updated]
                      );
                      setMarketplaceMessage("Marketplace item updated successfully.");
                      fetchAuditLogs();
                    } else {
                      const res = await axios.post(`${API_BASE}/marketplace`, payload, { headers });
                      const created = res.data;
                      setAdminMarketplaceItems((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
                      setMarketplaceMessage("Marketplace item created successfully.");
                      fetchAuditLogs();
                    }
                    setShowMarketplaceForm(false);
                    setEditingMarketplaceId(null);
                  } catch (err) {
                    setMarketplaceMessage("Failed to save marketplace item.");
                  } finally {
                    setMarketplaceSubmitting(false);
                  }
                }}
                className="admin-marketplace-form"
              >
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>Title</label>
                <input className="admin-search-input" placeholder="e.g. Plant 10 Trees" value={marketplaceDraft.itemName} onChange={(e) => setMarketplaceDraft((p) => ({ ...p, itemName: e.target.value }))} />
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>Category</label>
                <select className="admin-search-input" value={marketplaceDraft.itemType} onChange={(e) => setMarketplaceDraft((p) => ({ ...p, itemType: e.target.value }))}>
                  {marketplaceAdminCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="admin-marketplace-form-row">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>Price (₹)</label>
                    <input className="admin-search-input" type="number" min="0" step="0.01" placeholder="Price" value={marketplaceDraft.price} onChange={(e) => setMarketplaceDraft((p) => ({ ...p, price: e.target.value }))} />
                  </div>
                </div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>Description</label>
                <textarea className="admin-textarea" placeholder="Short description for the card" value={marketplaceDraft.description} onChange={(e) => setMarketplaceDraft((p) => ({ ...p, description: e.target.value }))} rows={3} />
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>CO₂ offset (kg)</label>
                <input className="admin-search-input" type="number" step="0.01" placeholder="e.g. 220" value={marketplaceDraft.carbonOffsetValue} onChange={(e) => setMarketplaceDraft((p) => ({ ...p, carbonOffsetValue: e.target.value }))} />
                <button type="submit" className="admin-action-btn admin-action-btn-primary" disabled={marketplaceSubmitting}>
                  {marketplaceSubmitting ? "Saving..." : editingMarketplaceId ? "Save Changes" : "Create Item"}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="admin-marketplace-grid">
          {paginatedRows.map((item) => (
            <div className="admin-product-card" key={item.id}>
              <div className={`admin-marketplace-card-banner ${categoryBannerClass[item.type] || "carbon-offset"}`}>
                {item.headerIcon || categoryMeta[item.type] || "🌿"}
              </div>
              <div className="admin-marketplace-card-body">
                <span className="admin-product-type">{(categoryMeta[item.type] || "🌿")} {item.type}</span>
                <h4 className="admin-product-name">{item.name}</h4>
                <p className="admin-product-desc">{item.desc}</p>
                <div className="admin-marketplace-card-meta">
                  <span className="admin-marketplace-card-offset">
                    <span className="admin-marketplace-card-offset-icon">🍃</span>
                    {Number(item.carbonOffset || 0).toFixed(0)} kg CO2
                  </span>
                </div>
              </div>
              <div className="admin-marketplace-card-footer">
                <span className="admin-product-price">
                  ₹{Number(item.price || 0).toLocaleString("en-IN")}
                  <span style={{ fontSize: 12, opacity: 0.85 }}> /{item.priceUnit || "unit"}</span>
                </span>
              </div>
              <div className="admin-actions-row" style={{ marginTop: 10, padding: "0 20px 18px" }}>
                <button
                  type="button"
                  className="admin-action-btn"
                  onClick={() => {
                    const raw = (adminMarketplaceItems || []).find((i) => i.id === item.id) || {};
                    setEditingMarketplaceId(item.id);
                    setMarketplaceDraft({
                      itemName: raw.itemName || item.name,
                      itemType: raw.itemType || item.type || "Carbon Offset",
                      price: String(raw.price ?? item.price ?? ""),
                      description: raw.description || item.desc || "",
                      carbonOffsetValue:
                        raw.carbonOffsetValue != null && raw.carbonOffsetValue !== ""
                          ? String(raw.carbonOffsetValue)
                          : item.carbonOffset != null && item.carbonOffset !== ""
                            ? String(item.carbonOffset)
                            : "",
                    });
                    setMarketplaceMessage("");
                    setShowMarketplaceForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn-danger"
                  onClick={async () => {
                    const confirmDelete = window.confirm(`Delete marketplace item "${item.name}"?`);
                    if (!confirmDelete) return;
                    const token = localStorage.getItem("token");
                    if (!token) {
                      navigate("/login");
                      return;
                    }
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      await axios.delete(`${API_BASE}/marketplace/${item.id}`, { headers });
                      setAdminMarketplaceItems((prev) =>
                        Array.isArray(prev) ? prev.filter((i) => i.id !== item.id) : prev
                      );
                      setMarketplaceMessage("Marketplace item removed.");
                      fetchAuditLogs();
                    } catch (err) {
                      setMarketplaceMessage("Failed to remove marketplace item.");
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <AdminPaginationBar
          page={page}
          setPage={setAdminMarketplacePage}
          totalCount={filteredRows.length}
          ariaLabel="Marketplace card pages"
        />
        {filteredRows.length === 0 && (
          <div className="admin-table-card" style={{ padding: 16, textAlign: "center", color: "var(--color-text-muted)" }}>
            No marketplace items match your filters.
          </div>
        )}
      </>
    );
  }

  // ══════════════════════════════════════════
  // 8. TRANSACTION MONITORING
  // ══════════════════════════════════════════
  function renderTransactions() {
    const rows = adminTxRows;
    const filteredRows = rows.filter((t) => {
      const status = String(t.status || "").toLowerCase();
      if (adminTxStatusFilter === "all") return true;
      return status === adminTxStatusFilter;
    });
    const totalAmount = filteredRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminTxPage), totalPages);
    const slice = filteredRows.slice(
      (page - 1) * ADMIN_PAGE_SIZE,
      page * ADMIN_PAGE_SIZE
    );

    return (
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Transaction History</h3>
          <div className="admin-tx-header-actions">
            <select
              className="admin-search-input admin-tx-status-select"
              value={adminTxStatusFilter}
              onChange={(e) => setAdminTxStatusFilter(e.target.value)}
              aria-label="Filter transactions by status"
            >
              <option value="all">All status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <p className="admin-tx-revenue">
              Total revenue:{" "}
              <strong className="admin-tx-revenue-value">₹{totalAmount.toFixed(2)}</strong>
            </p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td><strong>{t.user}</strong></td>
                  <td>{t.item}</td>
                  <td><strong style={{ color: "var(--color-primary)" }}>₹{t.amount}</strong></td>
                  <td>{t.date ? new Date(t.date).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <span className={`admin-status ${String(t.status).toLowerCase().includes("success") || String(t.status).toLowerCase().includes("complete") ? "admin-status-completed" : "admin-status-pending"}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdminPaginationBar
            page={page}
            setPage={setAdminTxPage}
            totalCount={filteredRows.length}
            ariaLabel="Transaction list pages"
          />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // 9. NOTIFICATION MANAGEMENT
  // ══════════════════════════════════════════
  function renderNotifications() {
    const validAdminNotifFilters = new Set([
      "all",
      "goal",
      "badge",
      "leaderboard",
      "emission",
      "purchase",
      "system",
    ]);
    const activeFilter = validAdminNotifFilters.has(adminNotificationFilter)
      ? adminNotificationFilter
      : "all";

    const filteredRows = adminNotifFiltered;
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminNotifListPage), totalPages);
    const slice = filteredRows.slice(
      (page - 1) * ADMIN_PAGE_SIZE,
      page * ADMIN_PAGE_SIZE
    );

    const ADMIN_NOTIF_FILTERS = [
      { key: "all", label: "All" },
      { key: "goal", label: "🎯 Goals" },
      { key: "badge", label: "🏅 Badges" },
      { key: "leaderboard", label: "🏆 Leaderboard" },
      { key: "emission", label: "⚠️ Emissions" },
      { key: "purchase", label: "🛒 Purchases" },
      { key: "system", label: "🔔 System" },
    ];

    return (
      <div className="admin-table-card admin-notif-card">
        <div className="admin-notif-header admin-table-header">
          <div>
            <h3 className="admin-table-title" style={{ margin: "0 0 6px" }}>System Notifications</h3>
            <p className="admin-notif-subtitle">
              Create and review notifications. Filters are by category only.
            </p>
          </div>
          <div className="admin-notif-header-actions">
            <button
              type="button"
              className="admin-action-btn admin-action-btn-primary"
              onClick={() => {
                if (notificationFormCloseTimerRef.current) {
                  clearTimeout(notificationFormCloseTimerRef.current);
                  notificationFormCloseTimerRef.current = null;
                }
                setEditingNotificationId(null);
                setNotificationDraft({
                  title: "",
                  type: "SYSTEM",
                  message: "",
                  audience: "all",
                  userId: "",
                });
                setNotificationMessage("");
                setShowNotificationForm(true);
              }}
            >
              + Create Notification
            </button>
          </div>
        </div>
        {notificationMessage && !showNotificationForm && (
          <div
            className={`admin-notif-alert ${isAdminNotifAlertError(notificationMessage) ? "is-error" : "is-success"}`}
            role="status"
            aria-live="polite"
          >
            <span className="admin-notif-alert-icon" aria-hidden>
              {isAdminNotifAlertError(notificationMessage) ? "!" : "✓"}
            </span>
            <span className="admin-notif-alert-text">{notificationMessage}</span>
          </div>
        )}

        <div className="admin-notif-filters">
          {ADMIN_NOTIF_FILTERS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`admin-notif-filter-chip ${activeFilter === opt.key ? "active" : ""}`}
              onClick={() => setAdminNotificationFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {showNotificationForm && (
          <div className="admin-notif-modal-overlay">
            <div className="admin-notif-modal" role="dialog" aria-labelledby="admin-notif-modal-title">
              <div className="admin-notif-modal-head">
                <h3 id="admin-notif-modal-title" className="admin-notif-modal-title">
                  {editingNotificationId ? "Edit notification" : "Create notification"}
                </h3>
                <button type="button" className="admin-notif-modal-close" onClick={closeNotificationForm} aria-label="Close">✕</button>
              </div>
              <form
                className="admin-notif-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem("token");
                  if (!token) {
                    navigate("/login");
                    return;
                  }
                  if (!notificationDraft.title || !notificationDraft.message) {
                    setNotificationMessage("Title and message are required.");
                    return;
                  }
                  if (notificationDraft.audience === "user" && !String(notificationDraft.userId || "").trim()) {
                    setNotificationMessage("Select a user or enter a user ID for a targeted notification.");
                    return;
                  }
                  setNotificationSubmitting(true);
                  setNotificationMessage("");
                  try {
                    const headers = { Authorization: `Bearer ${token}` };
                    const targetUserId =
                      notificationDraft.audience === "user" && notificationDraft.userId
                        ? Number(notificationDraft.userId)
                        : null;
                    const payload = {
                      title: notificationDraft.title,
                      message: notificationDraft.message,
                      type: notificationDraft.type || "SYSTEM",
                      userId: Number.isFinite(targetUserId) ? targetUserId : null,
                    };
                    if (editingNotificationId) {
                      const res = await axios.put(`${API_BASE}/notifications/${editingNotificationId}`, payload, { headers });
                      const updated = res.data;
                      setAdminNotifications((prev) =>
                        Array.isArray(prev) ? prev.map((n) => (n.id === updated.id ? updated : n)) : [updated]
                      );
                      setNotificationMessage("Notification updated successfully.");
                      fetchAuditLogs();
                    } else {
                      const res = await axios.post(`${API_BASE}/notifications`, payload, { headers });
                      const created = res.data;
                      setAdminNotifications((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
                      setNotificationMessage("Notification created successfully.");
                      fetchAuditLogs();
                    }
                    if (notificationFormCloseTimerRef.current) {
                      clearTimeout(notificationFormCloseTimerRef.current);
                      notificationFormCloseTimerRef.current = null;
                    }
                    notificationFormCloseTimerRef.current = setTimeout(() => {
                      setShowNotificationForm(false);
                      setEditingNotificationId(null);
                      setNotificationMessage("");
                      notificationFormCloseTimerRef.current = null;
                    }, 2200);
                  } catch (err) {
                    setNotificationMessage("Failed to save notification.");
                  } finally {
                    setNotificationSubmitting(false);
                  }
                }}
              >
                {notificationMessage && (
                  <div
                    className={`admin-notif-alert admin-notif-alert--in-form ${isAdminNotifAlertError(notificationMessage) ? "is-error" : "is-success"}`}
                    role="status"
                    aria-live="polite"
                  >
                    <span className="admin-notif-alert-icon" aria-hidden>
                      {isAdminNotifAlertError(notificationMessage) ? "!" : "✓"}
                    </span>
                    <span className="admin-notif-alert-text">{notificationMessage}</span>
                  </div>
                )}
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="admin-notif-title">Title</label>
                  <input
                    id="admin-notif-title"
                    className="admin-search-input admin-notif-input"
                    placeholder="Short headline"
                    value={notificationDraft.title}
                    onChange={(e) => setNotificationDraft((p) => ({ ...p, title: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="admin-notif-type">Category</label>
                  <select
                    id="admin-notif-type"
                    className="admin-search-input admin-notif-input"
                    value={notificationDraft.type}
                    onChange={(e) => setNotificationDraft((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="SYSTEM">System</option>
                    <option value="GOAL">Goal</option>
                    <option value="BADGE">Badge</option>
                    <option value="LEADERBOARD">Leaderboard</option>
                    <option value="EMISSION">Emission</option>
                    <option value="PURCHASE">Purchase</option>
                  </select>
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="admin-notif-message">Message</label>
                  <textarea
                    id="admin-notif-message"
                    className="admin-textarea admin-notif-textarea"
                    placeholder="Body text shown in the notification"
                    rows={4}
                    value={notificationDraft.message}
                    onChange={(e) => setNotificationDraft((p) => ({ ...p, message: e.target.value }))}
                  />
                </div>
                <div className="admin-notif-form-field">
                  <label className="admin-notif-form-label" htmlFor="admin-notif-audience">Send to</label>
                  <select
                    id="admin-notif-audience"
                    className="admin-search-input admin-notif-input"
                    value={notificationDraft.audience}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNotificationDraft((p) => ({
                        ...p,
                        audience: v,
                        userId: v === "all" ? "" : p.userId,
                      }));
                    }}
                  >
                    <option value="all">All users (broadcast)</option>
                    <option value="user">Specific user</option>
                  </select>
                </div>
                {notificationDraft.audience === "user" && (
                  <div className="admin-notif-form-field">
                    <label className="admin-notif-form-label" htmlFor="admin-notif-user">
                      User
                    </label>
                    {Array.isArray(allUsers) && allUsers.length > 0 ? (
                      <select
                        id="admin-notif-user"
                        className="admin-search-input admin-notif-input"
                        value={notificationDraft.userId}
                        onChange={(e) => setNotificationDraft((p) => ({ ...p, userId: e.target.value }))}
                      >
                        <option value="">Select a user…</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {(u.name || u.email || `User ${u.id}`) + (u.email ? ` — ${u.email}` : "")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="admin-notif-user"
                        className="admin-search-input admin-notif-input"
                        type="number"
                        min="1"
                        placeholder="User ID"
                        value={notificationDraft.userId}
                        onChange={(e) => setNotificationDraft((p) => ({ ...p, userId: e.target.value }))}
                      />
                    )}
                    <p className="admin-notif-form-hint">Targeted notifications are stored for that user only.</p>
                  </div>
                )}
                <div className="admin-notif-form-actions">
                  <button type="submit" className="admin-action-btn admin-action-btn-primary admin-notif-submit-btn" disabled={notificationSubmitting}>
                    {notificationSubmitting ? "Saving…" : editingNotificationId ? "Save changes" : "Create notification"}
                  </button>
                  <button
                    type="button"
                    className="admin-notif-cancel-btn"
                    onClick={closeNotificationForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="notifications-page admin-notif-list-wrap">
          {filteredRows.length === 0 ? (
            <div className="notifications-empty admin-notif-empty">
              <span className="notifications-empty-icon">🔔</span>
              <h3 className="notifications-empty-title">No notifications</h3>
              <p className="notifications-empty-desc">
                No items match this filter. Try &quot;All&quot; or create a new notification.
              </p>
            </div>
          ) : (
            <>
            <div className="notifications-list">
              {slice.map((notif) => {
                const meta = ADMIN_NOTIF_TYPE_META[notif.typeKey] || ADMIN_NOTIF_TYPE_META.system;
                const u = notif.raw?.user;
                const recipient =
                  u == null
                    ? "Broadcast (all users)"
                    : `User: ${u.email || u.name || `#${u.id}`}`;
                return (
                  <div
                    key={notif.id}
                    className="notification-card read admin-notif-row"
                  >
                    <div className={`notification-icon-bubble ${notif.typeKey}`}>
                      {meta.icon}
                    </div>

                    <div className="notification-body">
                      <p className="notification-message">
                        {notif.title ? (
                          <>
                            <strong>{notif.title}</strong>
                            {notif.message ? (
                              <>
                                {" "}
                                {notif.message}
                              </>
                            ) : null}
                          </>
                        ) : (
                          notif.message || "—"
                        )}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                        {recipient}
                      </p>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {adminNotificationTimeAgo(notif.timestamp)}
                        </span>
                        <span className={`notification-type-badge ${notif.typeKey}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    <div className="notification-actions admin-notif-actions">
                      <button
                        type="button"
                        className="admin-notif-action-edit"
                        onClick={() => {
                          if (notificationFormCloseTimerRef.current) {
                            clearTimeout(notificationFormCloseTimerRef.current);
                            notificationFormCloseTimerRef.current = null;
                          }
                          const raw = notif.raw || {};
                          setEditingNotificationId(notif.id);
                          setNotificationDraft({
                            title: raw.title || "",
                            message: raw.message || "",
                            type: (raw.type || "SYSTEM").toString().toUpperCase(),
                            audience: raw.user?.id ? "user" : "all",
                            userId: raw.user?.id ? String(raw.user.id) : "",
                          });
                          setNotificationMessage("");
                          setShowNotificationForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-notif-action-delete"
                        onClick={async () => {
                          const confirmDelete = window.confirm("Delete this notification?");
                          if (!confirmDelete) return;
                          const token = localStorage.getItem("token");
                          if (!token) {
                            navigate("/login");
                            return;
                          }
                          try {
                            const headers = { Authorization: `Bearer ${token}` };
                            await axios.delete(`${API_BASE}/notifications/${notif.id}`, { headers });
                            setAdminNotifications((prev) =>
                              (Array.isArray(prev) ? prev : []).filter((x) => x.id !== notif.id)
                            );
                            setNotificationMessage("Notification removed.");
                            fetchAuditLogs();
                          } catch (err) {
                            setNotificationMessage("Failed to remove notification.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <AdminPaginationBar
              page={page}
              setPage={setAdminNotifListPage}
              totalCount={filteredRows.length}
              ariaLabel="Notification list pages"
            />
            </>
          )}
        </div>
      </div>
    );
  }

  function renderSettings() {
    const calculationFactorFields = [
      {
        key: "electricityFactor",
        label: "Electricity factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.electricityFactor,
        help: "Used for daily electricity kWh in the lifestyle survey.",
      },
      {
        key: "carPetrolFactor",
        label: "Car petrol factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.carPetrolFactor,
        help: "Used when transport is car and fuel is petrol.",
      },
      {
        key: "carDieselFactor",
        label: "Car diesel factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.carDieselFactor,
        help: "Used when transport is car and fuel is diesel.",
      },
      {
        key: "carElectricFactor",
        label: "Car electric factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.carElectricFactor,
        help: "Used when transport is car and fuel is electric.",
      },
      {
        key: "transportFactor",
        label: "Public transport factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.transportFactor,
        help: "Used when transport is public transport.",
      },
      {
        key: "bikeFactor",
        label: "Bike factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.bikeFactor,
        help: "Used when transport is bike.",
      },
      {
        key: "foodVegFactor",
        label: "Vegetarian meal factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.foodVegFactor,
        help: "Used when the user selects vegetarian diet.",
      },
      {
        key: "foodNonVegFactor",
        label: "Non-vegetarian meal factor",
        defaultValue: DEFAULT_CALCULATION_FACTORS.foodNonVegFactor,
        help: "Used when the user selects non-vegetarian diet.",
      },
    ];

    return (
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Admin Settings</h3>
        </div>
        {settingsMessage && (
          <div className="admin-settings-message-wrap">
            <p
              className={`admin-settings-message ${
                settingsMessage.toLowerCase().includes("success") ? "is-success" : "is-error"
              }`}
            >
              {settingsMessage}
            </p>
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
              navigate("/login");
              return;
            }
            setSettingsMessage("");
            const factorPayload = {};
            for (const field of calculationFactorFields) {
              const rawValue = String(adminSettings[field.key] ?? "").trim();
              const numericValue = Number(rawValue);
              if (!rawValue || !Number.isFinite(numericValue) || numericValue < 0) {
                setSettingsMessage(`Enter a valid non-negative value for ${field.label}.`);
                return;
              }
              factorPayload[field.key] = numericValue;
            }
            setSettingsSaving(true);
            try {
              const headers = { Authorization: `Bearer ${token}` };
              const payload = {
                maintenanceMode: Boolean(adminSettings.maintenanceMode),
                ...factorPayload,
              };
              await axios.put(`${API_BASE}/admin/settings`, payload, { headers });
              setAdminSettings((prev) => ({
                ...prev,
                ...factorPayload,
                lastUpdatedBy: user?.name || user?.email || "Admin",
                lastUpdatedAt: new Date().toISOString(),
              }));
              setSettingsMessage("Settings updated successfully.");
              fetchAuditLogs();
            } catch (err) {
              setSettingsMessage("Failed to update settings. Please try again.");
            } finally {
              setSettingsSaving(false);
            }
          }}
          className="admin-settings-form"
        >
          <div className="admin-settings-section admin-settings-section--single">
            <div className="admin-settings-grid admin-settings-grid--single">
              <div className="admin-settings-column admin-settings-column--toggle admin-settings-panel">
                <h4 className="admin-settings-panel-title">Maintenance Control</h4>
                <div className="admin-settings-field admin-settings-field--centered">
                  <span className="admin-settings-label">Maintenance mode</span>
                  <label className="admin-settings-switch-row">
                    <input
                      type="checkbox"
                      className="admin-settings-switch-input"
                      checked={Boolean(adminSettings.maintenanceMode)}
                      onChange={(e) =>
                        setAdminSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                      }
                    />
                    <span className="admin-settings-switch-slider" aria-hidden />
                    <span className={`admin-settings-switch-text ${adminSettings.maintenanceMode ? "is-on" : "is-off"}`}>
                      {adminSettings.maintenanceMode ? "ON (maintenance active)" : "OFF (application live)"}
                    </span>
                  </label>
                  <p className="admin-settings-help">
                    Turn ON to place the site in maintenance mode.
                  </p>
                </div>
              </div>
              <div className="admin-settings-column admin-settings-panel">
                <h4 className="admin-settings-panel-title">Lifestyle Survey Calculation</h4>
                <p className="admin-settings-help">
                  Change the emission factors used when users submit the Lifestyle Survey.
                </p>
                <div className="admin-factor-grid">
                  {calculationFactorFields.map((field) => (
                    <label key={field.key} className="admin-factor-field">
                      <span className="admin-settings-label">{field.label}</span>
                      <input
                        type="number"
                        className="admin-search-input admin-factor-input"
                        min="0"
                        step="0.001"
                        value={adminSettings[field.key] ?? field.defaultValue}
                        placeholder={field.defaultValue}
                        onChange={(e) =>
                          setAdminSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                      <span className="admin-settings-help">{field.help}</span>
                    </label>
                  ))}
                </div>
                <div className="admin-settings-actions">
                  <button
                    type="submit"
                    className="admin-action-btn admin-action-btn-primary"
                    disabled={settingsSaving}
                    style={{ minWidth: 170 }}
                  >
                    {settingsSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────
  return (
    <AppLayout>
      <div className="admin-page">
        {/* Main Content (tabs are now in global sidebar) */}
        <div className="admin-content">
          <div className="admin-content-header">
            <h1 className="admin-content-title">
              <span>{currentTab.icon}</span>
              {currentTab.label}
            </h1>
            <p className="admin-content-subtitle">
              {activeTab === "analytics" && "Overview of system performance and user engagement."}
              {activeTab === "users" && "Manage registered users, view profiles, and monitor activity."}
              {activeTab === "goals" &&
                "Track sustainability goals for non-admin users: category, timeframe, dates, progress, and status (newest first)."}
              {activeTab === "badges" && "Create and manage achievement badges."}
              {activeTab === "leaderboard" && "View and manage user rankings and scoring rules."}
              {activeTab === "marketplace" && "Manage eco marketplace products and listings."}
              {activeTab === "transactions" && "Track user purchases in the eco marketplace."}
              {activeTab === "notifications" && "Monitor system notifications and alerts."}
              {activeTab === "contact-inbox" &&
                "Messages from the public Contact form (name, email, subject, message)."}
              {activeTab === "admin-logs" && "View consolidated activity logs for admin monitoring."}
              {activeTab === "settings" && "Maintenance and configuration settings for the admin panel."}
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
}

export default AdminDashboard;
