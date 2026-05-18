import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken } from "../utils/auth";
import "./Badges.css";
const PAGE_SIZE = 18;

// Default color mapping by icon / code; backend is source of truth
const DEFAULT_COLOR = "badge-green";

const FILTER_OPTIONS = [
  { key: "all",    label: "All" },
  { key: "earned", label: "✅ Earned" },
  { key: "locked", label: "🔒 Locked" },
];

function badgeEarnedTime(b) {
  if (!b?.earnedAt) return 0;
  const t = new Date(b.earnedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function compareName(a, b) {
  return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" });
}

/** Same logical badge regardless of spacing / case (matches API + template rows). */
function normalizeBadgeKey(name) {
  return String(name ?? "").trim().toLowerCase();
}

function rawAwardTimeMs(b) {
  const raw = b?.awardedAt ?? b?.createdAt ?? b?.earnedAt;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** One template per display name; if DB has duplicates, keep the lowest id (original row). */
function dedupeTemplatesByName(templates) {
  const map = new Map();
  for (const tpl of templates) {
    const key = normalizeBadgeKey(tpl.name);
    if (!key) continue;
    const prev = map.get(key);
    if (!prev || Number(tpl.id) < Number(prev.id)) {
      map.set(key, tpl);
    }
  }
  return [...map.values()];
}

function mergeEarnedByNormName(earnedRows) {
  const map = new Map();
  for (const b of earnedRows) {
    const key = normalizeBadgeKey(b.badgeName || b.name);
    if (!key) continue;
    const prev = map.get(key);
    if (!prev || rawAwardTimeMs(b) >= rawAwardTimeMs(prev)) {
      map.set(key, b);
    }
  }
  return map;
}

/** Earned badges first; among earned, newest first; locked sorted by name. */
function sortBadgesEarnedFirstThenLocked(list) {
  return [...list].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) {
      const dt = badgeEarnedTime(b) - badgeEarnedTime(a);
      if (dt !== 0) return dt;
    }
    return compareName(a, b);
  });
}

function sortEarnedByNewest(list) {
  return [...list].sort((a, b) => {
    const dt = badgeEarnedTime(b) - badgeEarnedTime(a);
    if (dt !== 0) return dt;
    return compareName(a, b);
  });
}

function sortLockedByName(list) {
  return [...list].sort(compareName);
}

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

function Badges() {
  const navigate = useNavigate();
  const [badges, setBadges]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [filter, setFilter]             = useState("all");
  const [page, setPage]                 = useState(1);

  const resolveIcon = (tpl) => {
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

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { navigate("/login"); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch catalog (badge templates) + earned badges in parallel
    Promise.all([
      axios.get(`${API_BASE}/badge-templates`, { headers }),
      axios.get(`${API_BASE}/badges`, { headers }),
    ])
      .then(([templateRes, earnedRes]) => {
        const allTemplates = Array.isArray(templateRes.data) ? templateRes.data : [];
        // Only show active badge templates to end users
        const templatesActive = allTemplates.filter((t) => t.active !== false);
        const templates = dedupeTemplatesByName(templatesActive);
        const earned = Array.isArray(earnedRes.data) ? earnedRes.data : [];

        const earnedByNormName = mergeEarnedByNormName(earned);

        const merged = templates.map((tpl) => {
          const name = tpl.name;
          const earnedBadge = earnedByNormName.get(normalizeBadgeKey(name));

          // Derive icon/color for frontend
          const icon = resolveIcon(tpl);
          const color =
            icon === "📅" ? "badge-blue" :
            icon === "📊" ? "badge-blue" :
            icon === "🍃" ? "badge-green" :
            icon === "🔥" ? "badge-amber" :
            icon === "📋" ? "badge-purple" :
            icon === "✂️" ? "badge-blue" :
            icon === "🏆" ? "badge-amber" :
            icon === "🌳" ? "badge-green" :
            icon === "☀️" ? "badge-amber" :
            icon === "🤝" ? "badge-purple" :
            icon === "🎯" ? "badge-amber" :
            icon === "✅" ? "badge-green" :
            DEFAULT_COLOR;

          return {
            id: tpl.id,
            name,
            icon,
            color,
            desc: tpl.description || tpl.conditionText || "",
            earned: Boolean(earnedBadge),
            earnedAt: earnedBadge?.awardedAt || earnedBadge?.createdAt || null,
          };
        });

        setBadges(merged);
      })
      .catch(() => {
        // If backend unreachable, show empty list
        setBadges([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // ── Derived values ────────────────────────────────────────
  const earned   = badges.filter((b) => b.earned);
  const locked   = badges.filter((b) => !b.earned);
  const progress = badges.length > 0
    ? Math.round((earned.length / badges.length) * 100)
    : 0;

  const filteredBadges = useMemo(() => {
    const e = badges.filter((b) => b.earned);
    const l = badges.filter((b) => !b.earned);
    if (filter === "earned") return sortEarnedByNewest(e);
    if (filter === "locked") return sortLockedByName(l);
    return sortBadgesEarnedFirstThenLocked(badges);
  }, [badges, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedBadges = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredBadges.slice(start, start + PAGE_SIZE);
  }, [filteredBadges, page]);

  const pageItems = useMemo(
    () => buildPageItems(totalPages, page),
    [totalPages, page]
  );

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : null;

  // ── Render ────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="badges-page">

        {/* ── Header ── */}
        <div className="badges-page-header">
          <div className="badges-page-title-wrap">
            <h1 className="badges-page-title">🏅 My Badges</h1>
            <p className="badges-page-subtitle">
              Earn badges by building eco-friendly habits and reducing your carbon footprint.
            </p>
          </div>

          {/* Progress card */}
          <div className="badges-progress-card">
            <span className="badges-progress-label">Overall Progress</span>
            <span className="badges-progress-count">
              {earned.length}
              <span className="badges-progress-total"> / {badges.length}</span>
            </span>
            <div className="badges-progress-bar-wrap">
              <div
                className="badges-progress-bar"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="badges-progress-pct">{progress}% earned</span>
          </div>
        </div>

        {loading ? (
          <div className="badges-loading">
            <div className="badges-spinner" />
            <p>Loading your badges…</p>
          </div>
        ) : (
          <>
            {/* ── Filter tabs ── */}
            <div className="badges-filter-tabs">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`badges-filter-btn ${filter === opt.key ? "active" : ""}`}
                  onClick={() => setFilter(opt.key)}
                >
                  {opt.label}
                  <span className="badges-filter-count">
                    {opt.key === "all"    ? badges.length :
                     opt.key === "earned" ? earned.length :
                     locked.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="badges-content">
              {/* ── Badge grid ── */}
              {filteredBadges.length === 0 ? (
                <div className="badges-all-earned card">
                  <span className="badges-all-earned-icon">
                    {filter === "earned" ? "🎉" : "🔓"}
                  </span>
                  <p>
                    {filter === "earned"
                      ? "You haven't earned any badges yet. Start logging your carbon footprint!"
                      : "You've earned every badge! Incredible work! 🌍"}
                  </p>
                </div>
              ) : (
                <section className="badges-section">
                  <div className="badges-grid">
                    {paginatedBadges.map((badge) => (
                      <button
                        key={badge.id || badge.name}
                        type="button"
                        className={`badge-tile ${badge.earned ? `earned ${badge.color}` : "locked"} card`}
                        onClick={() => setSelectedBadge(badge)}
                        aria-label={`${badge.earned ? "Earned badge" : "Locked badge"}: ${badge.name}`}
                      >
                        <span className={`badge-tile-icon ${!badge.earned ? "badge-tile-icon-locked" : ""}`}>
                          {badge.icon}
                        </span>
                        <span className="badge-tile-name">{badge.name}</span>
                        {badge.earned && badge.earnedAt && (
                          <span className="badge-tile-date">{formatDate(badge.earnedAt)}</span>
                        )}
                        {badge.earned
                          ? <span className="badge-tile-earned-dot" aria-hidden>✦</span>
                          : <span className="badge-tile-lock-icon"  aria-hidden>🔒</span>
                        }
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {filteredBadges.length > 0 && (
                <nav className="badges-pagination" aria-label="Badges pages">
                  <span className="badges-pagination-range">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredBadges.length)} of {filteredBadges.length}
                  </span>
                  {totalPages > 1 && (
                    <div className="badges-pagination-controls">
                      <button
                        type="button"
                        className="badges-pagination-nav"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <div className="badges-pagination-pages">
                        {pageItems.map((item, idx) =>
                          item === "ellipsis" ? (
                            <span key={`e-${idx}`} className="badges-pagination-ellipsis" aria-hidden>
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              className={`badges-pagination-page ${page === item ? "active" : ""}`}
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
                        className="badges-pagination-nav"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </nav>
              )}
            </div>
          </>
        )}

        {/* ── Badge Detail Modal ── */}
        {selectedBadge && (
          <div
            className="badge-modal-overlay"
            onClick={() => setSelectedBadge(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Badge: ${selectedBadge.name}`}
          >
            <div
              className={`badge-modal ${selectedBadge.earned ? selectedBadge.color : ""} card`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="badge-modal-close"
                onClick={() => setSelectedBadge(null)}
                aria-label="Close"
              >
                ×
              </button>
              <span className="badge-modal-icon">{selectedBadge.icon}</span>
              <h3 className="badge-modal-name">{selectedBadge.name}</h3>
              <p className="badge-modal-desc">{selectedBadge.desc}</p>
              {selectedBadge.earned ? (
                <span className="badge-modal-status earned">
                  ✦ Earned
                  {selectedBadge.earnedAt && ` · ${formatDate(selectedBadge.earnedAt)}`}
                </span>
              ) : (
                <span className="badge-modal-status locked">🔒 Not yet earned</span>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Badges;
