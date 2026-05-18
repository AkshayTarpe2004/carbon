import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken } from "../utils/auth";
import "./Transactions.css";

const PAGE_SIZE = 10;

/** Page numbers with ellipsis for long ranges (1 … 4 5 6 … 12). */
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

function Transactions() {
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [settlingId, setSettlingId] = useState(null);
  /** Pending row opened for confirmation (table button or notification deep link). */
  const [confirmModalTxn, setConfirmModalTxn] = useState(null);
  const [page, setPage] = useState(1);

  const mapTransactionRows = (rawList) => {
    const data = Array.isArray(rawList) ? rawList : [];
    return data.map((t) => ({
      id: t.id,
      itemName: t.itemName || t.marketplaceItemName || "",
      type: t.type || t.itemType || t.marketplaceItemType || "",
      quantity: t.quantity ?? t.qty ?? 1,
      amount: Number(t.amount || 0),
      carbonOffset: Number(
        t.carbonOffset ??
          t.carbonOffsetValue ??
          t.marketplaceItemCarbonOffset ??
          0
      ),
      status: t.status,
      date: t.createdAt || t.date || "",
    }));
  };

  const loadTransactions = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const meRes = await axios.get(`${API_BASE}/auth/me`, { headers });
      const userId = meRes.data?.id;
      if (!userId) throw new Error("User ID not found.");
      const res = await axios.get(`${API_BASE}/transactions/user/${userId}`, { headers });
      setTransactions(mapTransactionRows(res.data));
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const normalizeStatus = (status) => {
    const value = (status || "").toString().trim().toLowerCase();
    if (value === "in progress") return "in-progress";
    if (value === "confirmed" || value === "completed") return "success";
    return value;
  };

  const getDisplayStatus = (status) => {
    const v = normalizeStatus(status);
    if (v === "pending" || v === "in-progress") return "Pending";
    if (v === "failed") return "Failed";
    if (v === "success") return "Success";
    return "Success";
  };

  const getDisplayStatusClass = (status) => {
    const v = normalizeStatus(status);
    if (v === "pending" || v === "in-progress") return "pending";
    if (v === "failed") return "failed";
    return "completed";
  };

  /** Open confirmation from Notifications: navigate with `state: { openConfirmTransactionId }`. */
  useEffect(() => {
    const rawId = location.state?.openConfirmTransactionId;
    if (rawId == null || loading) return;
    const id = Number(rawId);
    const t = transactions.find(
      (x) => x.id === id && normalizeStatus(x.status) === "pending"
    );
    if (t) {
      setConfirmModalTxn(t);
      setStatusFilter("pending");
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [transactions, loading, location.state, location.pathname, navigate]);

  const pendingCount = useMemo(
    () => transactions.filter((t) => normalizeStatus(t.status) === "pending").length,
    [transactions]
  );

  const successCount = useMemo(
    () => transactions.filter((t) => normalizeStatus(t.status) === "success").length,
    [transactions]
  );

  const failedCount = useMemo(
    () => transactions.filter((t) => normalizeStatus(t.status) === "failed").length,
    [transactions]
  );

  const FILTER_OPTIONS = useMemo(
    () => [
      { key: "all", label: "All", count: transactions.length },
      { key: "pending", label: "Pending", count: pendingCount },
      { key: "completed", label: "Success", count: successCount },
      { key: "failed", label: "Failed", count: failedCount },
    ],
    [transactions.length, pendingCount, successCount, failedCount]
  );

  /** Finalize payment after user confirms in the modal. */
  const executeConfirmPayment = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    setSettlingId(id);
    try {
      await axios.patch(
        `${API_BASE}/transactions/${id}/payment-outcome`,
        { outcome: "SUCCESS" },
        { headers }
      );
      await loadTransactions();
      setConfirmModalTxn(null);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "object" && data?.message) ||
        (typeof data === "string" ? data : null) ||
        err.message ||
        "Could not confirm payment";
      window.alert(msg);
    } finally {
      setSettlingId(null);
    }
  };

  const closeConfirmModal = () => {
    if (settlingId !== null) return;
    setConfirmModalTxn(null);
  };

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = transactions.filter((t) => {
      const normalized = normalizeStatus(t.status);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
            ? normalized === "pending" || normalized === "in-progress"
            : statusFilter === "completed"
              ? normalized === "success"
              : statusFilter === "failed"
                ? normalized === "failed"
                : true;
      const matchesQuery =
        !q ||
        (t.itemName || "").toLowerCase().includes(q) ||
        (t.type || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
    const sorted = [...base];
    switch (sortBy) {
      case "oldest":
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "amount-high":
        sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case "amount-low":
        sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
      default: // newest
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return sorted;
  }, [transactions, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortBy]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const pageItems = useMemo(
    () => buildPageItems(totalPages, page),
    [totalPages, page]
  );

  const totalSpent = filteredTransactions.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOffset = filteredTransactions.reduce((s, t) => s + (t.carbonOffset || 0), 0);

  return (
    <AppLayout>
      <div className="tx-page">
        <div className="tx-header">
          <div className="tx-title-wrap">
            <h1 className="tx-title">💳 Transactions</h1>
            <p className="tx-subtitle">
              View your marketplace purchases and track their status.
            </p>
          </div>

          <div className="tx-stats">
            <div className="tx-stat">
              <span className="tx-stat-value">{filteredTransactions.length}</span>
              <span className="tx-stat-label">Transactions</span>
            </div>
            <div className="tx-stat">
              <span className="tx-stat-value">₹{totalSpent.toLocaleString("en-IN")}</span>
              <span className="tx-stat-label">Total Spent</span>
            </div>
            <div className="tx-stat">
              <span className="tx-stat-value">{totalOffset.toLocaleString()} kg</span>
              <span className="tx-stat-label">CO₂ Offset</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="tx-loading card">
            <div className="tx-spinner" />
            <p>Loading transactions…</p>
          </div>
        ) : (
          <section className="tx-main card">
            <div className="tx-toolbar">
              <div className="tx-search-wrap">
                <span className="tx-search-icon" aria-hidden>🔎</span>
                <input
                  type="text"
                  className="tx-search"
                  placeholder="Search by item, type, or status…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="tx-sort-wrap">
                <span className="tx-sort-label">Sort:</span>
                <select
                  className="tx-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </select>
              </div>
            </div>

            <div className="tx-filters">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`tx-filter-btn ${statusFilter === opt.key ? "active" : ""}`}
                  onClick={() => setStatusFilter(opt.key)}
                >
                  {opt.label}
                  <span className="tx-filter-count">{opt.count}</span>
                </button>
              ))}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="tx-empty">
                <span className="tx-empty-icon">🧾</span>
                <h3 className="tx-empty-title">No transactions found</h3>
                <p className="tx-empty-desc">
                  Try a different search or status filter.
                </p>
              </div>
            ) : (
              <div className="tx-table-wrap">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>CO₂ Offset</th>
                      <th>Status / action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => {
                      const statusClass = getDisplayStatusClass(txn.status);
                      const rawNorm = normalizeStatus(txn.status);
                      return (
                        <tr key={txn.id || `${txn.itemName}-${txn.date}`}>
                          <td>{formatDate(txn.date)}</td>
                          <td><strong>{txn.itemName || "—"}</strong></td>
                          <td>{txn.type || "—"}</td>
                          <td>{txn.quantity ?? "—"}</td>
                          <td className="tx-amount">₹{(txn.amount || 0).toLocaleString("en-IN")}</td>
                          <td>{(txn.carbonOffset || 0).toLocaleString()} kg</td>
                          <td className="tx-status-cell">
                            <div className="tx-status-row">
                              <span className={`tx-status ${statusClass}`}>
                                {getDisplayStatus(txn.status)}
                              </span>
                              {rawNorm === "pending" && txn.id != null && (
                                <button
                                  type="button"
                                  className="tx-confirm-payment-btn"
                                  onClick={() => setConfirmModalTxn(txn)}
                                  disabled={settlingId === txn.id}
                                >
                                  Confirm payment
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTransactions.length > 0 && (
                  <nav className="tx-pagination" aria-label="Transaction list pages">
                    <span className="tx-pagination-range">
                      Showing {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, filteredTransactions.length)} of{" "}
                      {filteredTransactions.length}
                    </span>
                    {totalPages > 1 && (
                      <div className="tx-pagination-controls">
                        <button
                          type="button"
                          className="tx-pagination-nav"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </button>
                        <div className="tx-pagination-pages">
                          {pageItems.map((item, idx) =>
                            item === "ellipsis" ? (
                              <span key={`e-${idx}`} className="tx-pagination-ellipsis" aria-hidden>
                                …
                              </span>
                            ) : (
                              <button
                                key={item}
                                type="button"
                                className={`tx-pagination-page ${page === item ? "active" : ""}`}
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
                          className="tx-pagination-nav"
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
            )}
          </section>
        )}

        {confirmModalTxn && confirmModalTxn.id != null && (
          <div
            className="tx-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-confirm-heading"
            onClick={closeConfirmModal}
          >
            <div className="tx-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="tx-confirm-close"
                onClick={closeConfirmModal}
                aria-label="Close"
              >
                ×
              </button>
              <h2 id="tx-confirm-heading" className="tx-confirm-title">
                Confirm payment
              </h2>
              <p className="tx-confirm-sub">
                Review your pending order. Confirm to complete, or cancel to leave it pending.
              </p>
              <div className="tx-confirm-details">
                <div className="tx-confirm-row">
                  <span>Item</span>
                  <strong>{confirmModalTxn.itemName || "—"}</strong>
                </div>
                <div className="tx-confirm-row">
                  <span>Type</span>
                  <strong>{confirmModalTxn.type || "—"}</strong>
                </div>
                <div className="tx-confirm-row">
                  <span>Quantity</span>
                  <strong>{confirmModalTxn.quantity ?? "—"}</strong>
                </div>
                <div className="tx-confirm-row">
                  <span>Total amount</span>
                  <strong className="tx-confirm-money">
                    ₹{(confirmModalTxn.amount || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
                <div className="tx-confirm-row tx-confirm-highlight">
                  <span>CO₂ offset (order)</span>
                  <strong className="tx-confirm-co2">
                    {(confirmModalTxn.carbonOffset || 0).toLocaleString()} kg
                  </strong>
                </div>
              </div>
              <div className="tx-confirm-actions">
                <button
                  type="button"
                  className="tx-confirm-primary"
                  onClick={() => executeConfirmPayment(confirmModalTxn.id)}
                  disabled={settlingId === confirmModalTxn.id}
                >
                  {settlingId === confirmModalTxn.id ? "Confirming…" : "Confirm"}
                </button>
                <button
                  type="button"
                  className="tx-confirm-secondary"
                  onClick={closeConfirmModal}
                  disabled={settlingId === confirmModalTxn.id}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Transactions;

