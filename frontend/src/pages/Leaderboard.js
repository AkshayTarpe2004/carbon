import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken } from "../utils/auth";
import "./Leaderboard.css";

const RANK_ICONS = ["🥇", "🥈", "🥉"];

function getWeekStartOffset(offsetWeeks = 0) {
  const d = new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday + offsetWeeks * 7);
  return d.toISOString().slice(0, 10);
}

function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [search, setSearch]             = useState("");
  const [boardFilter, setBoardFilter] = useState("live"); // live | last-week

  const fetchData = useCallback((isRefresh = false) => {
    const token = getStoredToken();
    if (!token) { navigate("/login"); return; }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    // Fetch current user identity
    axios
      .get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCurrentUserId(res.data?.id || null))
      .catch(() => {});

    // Fetch leaderboard (live or weekly snapshot)
    const leaderboardUrl =
      boardFilter === "live"
        ? `${API_BASE}/leaderboard`
        : `${API_BASE}/leaderboard/weekly?weekStart=${encodeURIComponent(
            getWeekStartOffset(-1)
          )}`;
    axios
      .get(leaderboardUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        // Live fallback: if live is empty, show current weekly leaderboard.
        if (boardFilter === "live" && data.length === 0) {
          return axios
            .get(`${API_BASE}/leaderboard/weekly?weekStart=${encodeURIComponent(getWeekStartOffset(0))}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((wRes) => (Array.isArray(wRes.data) ? wRes.data : []));
        }
        return data;
      })
      .then((finalData) => {
        const data = Array.isArray(finalData) ? finalData : [];
        const mapped = data.map((e, idx) => ({
          id:       e.userId   || e.user?.id   || idx,
          // backend sends `userName` (capital N) — support all variants
          username: e.userName || e.username || e.user?.name || e.user?.username || `User ${idx + 1}`,
          score:    Number(e.score) || 0,
        }));
        mapped.sort((a, b) => b.score - a.score);
        setEntries(mapped);
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [navigate, boardFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived data ─────────────────────────────────────────
  const filteredList = search.trim()
    ? entries.filter((e) =>
        e.username.toLowerCase().includes(search.trim().toLowerCase())
      )
    : entries;

  // Show only top 10 in the main list, but always include current user
  const baseTopTen = filteredList.slice(0, 10);
  const myIndexInFiltered = filteredList.findIndex(
    (e) => e.id === currentUserId
  );
  const myEntry =
    myIndexInFiltered >= 0 ? filteredList[myIndexInFiltered] : null;

  const displayList =
    myEntry && !baseTopTen.some((e) => e.id === myEntry.id)
      ? [...baseTopTen, myEntry]
      : baseTopTen;

  const top3 = entries.slice(0, 3);  // podium always from full list

  const getName  = (e) => e.username;
  const getScore = (e) => (e.score ?? 0).toLocaleString();

  const myRank = entries.findIndex((e) => e.id === currentUserId) + 1;

  // ── Render ───────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="lb-page">

        {/* ── Header ── */}
        <div className="lb-header">
          <div>
            <h1 className="lb-title">🏆 Leaderboard</h1>
            <p className="lb-subtitle">
              See how you rank against other eco-conscious users.
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
              View: {boardFilter === "live" ? "Live Leaderboard" : "Last Week Leaderboard"}
            </p>
            {myRank > 0 && (
              <p style={{ marginTop: 6, fontSize: 13, color: "var(--color-primary)", fontWeight: 700 }}>
                🎯 Your rank: #{myRank}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>

            {/* Refresh */}
            <button
              type="button"
              className="lb-refresh-btn"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              aria-label="Refresh leaderboard"
            >
              {refreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
            </button>
            <select
              className="lb-search-input"
              style={{ minWidth: 170 }}
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
            >
              <option value="live">Live leaderboard</option>
              <option value="last-week">Last week</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="lb-loading">
            <div className="lb-spinner" />
            <p>Loading leaderboard…</p>
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {top3.length >= 3 && (
              <section className="lb-podium-section">
                <div className="lb-podium">
                  {/* 2nd place */}
                  <div className="lb-podium-slot lb-podium-2">
                    <div className="lb-podium-avatar lb-avatar-silver">{RANK_ICONS[1]}</div>
                    <div className="lb-podium-name">{getName(top3[1])}</div>
                    <div className="lb-podium-score">{getScore(top3[1])} pts</div>
                    <div className="lb-podium-block lb-block-2" />
                  </div>
                  {/* 1st place */}
                  <div className="lb-podium-slot lb-podium-1">
                    <div className="lb-podium-crown">👑</div>
                    <div className="lb-podium-avatar lb-avatar-gold">{RANK_ICONS[0]}</div>
                    <div className="lb-podium-name lb-podium-name-first">{getName(top3[0])}</div>
                    <div className="lb-podium-score">{getScore(top3[0])} pts</div>
                    <div className="lb-podium-block lb-block-1" />
                  </div>
                  {/* 3rd place */}
                  <div className="lb-podium-slot lb-podium-3">
                    <div className="lb-podium-avatar lb-avatar-bronze">{RANK_ICONS[2]}</div>
                    <div className="lb-podium-name">{getName(top3[2])}</div>
                    <div className="lb-podium-score">{getScore(top3[2])} pts</div>
                    <div className="lb-podium-block lb-block-3" />
                  </div>
                </div>
              </section>
            )}

            {/* ── Rankings table ── */}
            <section className="lb-table-section card">
          <div className="lb-table-header">
          <h2 className="section-heading">Top 10 Rankings</h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Search */}
                  <input
                    type="text"
                    className="lb-search-input"
                    placeholder="Search user…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search leaderboard"
                  />
                </div>
              </div>

              {displayList.length === 0 ? (
                <div className="lb-empty">
                  <span className="lb-empty-icon">🔍</span>
                  <p>No results found for "<strong>{search}</strong>"</p>
                </div>
              ) : (
                <>
                  {/* ── Desktop table ── */}
                  <div className="lb-table-wrap">
                    <table className="lb-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>User</th>
                          <th style={{ textAlign: "right" }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayList.map((entry, idx) => {
                          // rank in full list (not filtered)
                          const fullRank = entries.findIndex((e) => e.id === entry.id);
                          const isMe = entry.id === currentUserId;
                          return (
                            <tr
                              key={entry.id}
                              className={[
                                "lb-row",
                                isMe ? "lb-row-me" : "",
                                fullRank === 0 ? "lb-row-top1" : fullRank === 1 ? "lb-row-top2" : fullRank === 2 ? "lb-row-top3" : "",
                              ].join(" ")}
                            >
                              <td className="lb-rank-cell">
                                {fullRank < 3
                                  ? <span className="lb-rank-medal">{RANK_ICONS[fullRank]}</span>
                                  : <span className="lb-rank-num">#{fullRank + 1}</span>}
                              </td>
                              <td className="lb-name-cell">
                                <div className="lb-user-wrap">
                                  <div className="lb-user-avatar">
                                    {getName(entry).charAt(0).toUpperCase()}
                                  </div>
                                  <span className="lb-user-name">
                                    {getName(entry)}
                                    {isMe && <span className="lb-you-chip">You</span>}
                                  </span>
                                </div>
                              </td>

                              <td className="lb-score-cell">
                                <span className="lb-score-value">{getScore(entry)}</span>
                                <span className="lb-score-unit"> pts</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile card list ── */}
                  <div className="lb-card-list">
                    {displayList.map((entry, idx) => {
                      const fullRank = entries.findIndex((e) => e.id === entry.id);
                      const isMe = entry.id === currentUserId;
                      return (
                        <div
                          key={entry.id}
                          className={[
                            "lb-card-item",
                            isMe ? "lb-row-me" : "",
                            fullRank === 0 ? "lb-row-top1" : fullRank === 1 ? "lb-row-top2" : fullRank === 2 ? "lb-row-top3" : "",
                          ].join(" ")}
                        >
                          <div className="lb-card-rank">
                            {fullRank < 3
                              ? <span className="lb-rank-medal">{RANK_ICONS[fullRank]}</span>
                              : <span className="lb-card-rank-num">#{fullRank + 1}</span>}
                          </div>
                          <div className="lb-card-info">
                            <div className="lb-card-name">
                              {getName(entry)}
                              {isMe && <span className="lb-you-chip">You</span>}
                            </div>

                          </div>
                          <div className="lb-card-score">
                            <span className="lb-card-score-val">{getScore(entry)}</span>
                            <span className="lb-card-score-unit">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Leaderboard;
