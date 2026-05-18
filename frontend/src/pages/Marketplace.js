import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken } from "../utils/auth";
import "./Marketplace.css";
const PAGE_SIZE = 3;

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

/* ── Category meta (icon, banner class, label) ────────── */
const CATEGORY_META = {
  "Carbon Offset":       { icon: "🌳", banner: "carbon-offset",       emoji: "🌳" },
  "Renewable Energy":    { icon: "☀️", banner: "renewable-energy",    emoji: "☀️" },
  "Environmental":       { icon: "🌍", banner: "environmental",       emoji: "🌍" },
  "Sustainable Living":  { icon: "♻️", banner: "sustainable-living",  emoji: "♻️" },
};

const CATEGORIES = ["All", ...Object.keys(CATEGORY_META)];

function normalizeTypeToSupported(rawType) {
  const raw = String(rawType || "").trim();
  const compact = raw.toLowerCase().replace(/[_\s-]+/g, "");
  if (compact === "carbonoffset") return "Carbon Offset";
  if (compact === "renewableenergy") return "Renewable Energy";
  if (compact === "environmental") return "Environmental";
  if (compact === "sustainableliving") return "Sustainable Living";
  return "Carbon Offset";
}

/** Map API DTO (itemName, itemType, …) to card shape used by this page */
function normalizeMarketplaceItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const price = raw.price != null ? Number(raw.price) : 0;
  const co =
    raw.carbonOffsetValue != null
      ? Number(raw.carbonOffsetValue)
      : raw.carbonOffset != null
        ? Number(raw.carbonOffset)
        : 0;
  const name = raw.itemName ?? raw.name ?? "Untitled";
  const type = normalizeTypeToSupported(raw.itemType ?? raw.type ?? "Carbon Offset");
  const badgeStr = raw.badge != null && String(raw.badge).trim() !== ""
    ? String(raw.badge).toLowerCase()
    : null;
  let ipp = null;
  if (raw.impactProgressPercent != null && raw.impactProgressPercent !== "") {
    const n = Number(raw.impactProgressPercent);
    if (!Number.isNaN(n)) ipp = Math.min(100, Math.max(0, Math.round(n)));
  }
  return {
    id: raw.id,
    name,
    type,
    description: raw.description ?? "",
    price,
    carbonOffset: co,
    badge: badgeStr,
    impactProgressPercent: ipp,
    priceUnit: raw.priceUnit && String(raw.priceUnit).trim() ? String(raw.priceUnit).trim() : "unit",
    headerIcon: raw.headerIcon && String(raw.headerIcon).trim() ? String(raw.headerIcon).trim() : null,
    bannerKey: null,
  };
}

/* ─────────────────────────────────────────────────────────
   MARKETPLACE COMPONENT
   ───────────────────────────────────────────────────────── */
function Marketplace() {
  const navigate = useNavigate();

  // ── State ──
  const [items, setItems]               = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity]         = useState(1);
  const [purchasing, setPurchasing]     = useState(false);
  const [toast, setToast]               = useState(null);
  const [toastTone, setToastTone]       = useState("success");
  /** Step 1 = review order; step 2 = confirm (details + Confirm / Cancel only). */
  const [checkoutStep, setCheckoutStep]         = useState("review");
  const [page, setPage]                 = useState(1);

  // ── Fetch marketplace items ──
  useEffect(() => {
    const token = getStoredToken();
    if (!token) { navigate("/login"); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Backend: /api/marketplace/items or /api/marketplace
    const fetchItems = axios
      .get(`${API_BASE}/marketplace/items`, { headers })
      .catch(() => axios.get(`${API_BASE}/marketplace`, { headers }))
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        return arr
          .map(normalizeMarketplaceItem)
          .filter((it) => it != null && it.id != null);
      })
      .catch((err) => {
        console.error("Marketplace items fetch failed", err);
        return [];
      });

    const fetchTxns = axios
      .get(`${API_BASE}/auth/me`, { headers })
      .then((meRes) => meRes.data?.id)
      .then((userId) => {
        if (!userId) throw new Error("User ID not found.");
        return axios.get(`${API_BASE}/transactions/user/${userId}`, { headers });
      })
      .then((res) => Array.isArray(res.data) ? res.data : [])
      .catch(() => []);

    Promise.all([fetchItems, fetchTxns])
      .then(([itemsData, txnData]) => {
        setItems(itemsData);
        setTransactions(txnData);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const isSuccessfulTxn = (t) => String(t.status || "").toUpperCase() === "SUCCESS";

  // ── Derived values (only completed purchases count toward headline stats) ──
  const totalOffset = transactions.filter(isSuccessfulTxn).reduce((s, t) => s + (Number(t.carbonOffset) || 0), 0);
  const totalSpent  = transactions.filter(isSuccessfulTxn).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // ── Filtering ──
  const filteredItems = useCallback(() => {
    let result = [...items];

    // Category filter
    if (category !== "All") {
      result = result.filter((item) => item.type === category);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.type || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, category, search]);

  const displayedItems = filteredItems();
  const totalPages = Math.max(1, Math.ceil(displayedItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedItems = displayedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageItems = buildPageItems(totalPages, page);

  // Category counts
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  // ── Handlers ──
  const closePurchaseModalOnly = () => {
    setSelectedItem(null);
    setQuantity(1);
    setCheckoutStep("review");
  };

  const openPurchaseModal = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setCheckoutStep("review");
  };

  const refreshUserTransactions = async (headers) => {
    const meRes2 = await axios.get(`${API_BASE}/auth/me`, { headers });
    const uid2 = meRes2.data?.id;
    if (uid2) {
      const txRes = await axios.get(`${API_BASE}/transactions/user/${uid2}`, { headers });
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    }
  };

  /** @param {"SUCCESS"|"PENDING"|"FAILED"} paymentStatus */
  const submitCheckout = async (paymentStatus) => {
    if (!selectedItem) return false;
    if (selectedItem.id == null) {
      setToastTone("error");
      setToast("Missing product id. Refresh the page and try again.");
      return false;
    }

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    setPurchasing(true);
    try {
      const meRes = await axios.get(`${API_BASE}/auth/me`, { headers });
      const userId = meRes.data?.id;
      if (!userId) {
        throw new Error("User ID not found for purchase.");
      }

      const res = await axios.post(
        `${API_BASE}/transactions`,
        {
          userId,
          marketplaceItemId: selectedItem.id,
          paymentStatus,
        },
        { headers }
      );

      const returnedStatus = String(res.data?.status || paymentStatus).toUpperCase();
      if (returnedStatus === "SUCCESS") {
        setToastTone("success");
        setToast(`Successfully completed: ${quantity}× ${selectedItem.name}.`);
      } else if (returnedStatus === "PENDING") {
        setToastTone("pending");
        setToast(`Checkout not finished — saved as pending. Complete payment from Transactions.`);
      } else if (returnedStatus === "FAILED") {
        setToastTone("error");
        setToast(`Payment failed (recorded). You can try again with another order.`);
      } else {
        setToastTone("success");
        setToast(`Order saved (${returnedStatus}).`);
      }

      closePurchaseModalOnly();
      await refreshUserTransactions(headers);
      return true;
    } catch (err) {
      console.error("Checkout failed", err);
      const status = err.response?.status;
      const data = err.response?.data;
      let detail = "Please try again.";
      if (typeof data === "string" && data.trim()) {
        detail = data.trim();
      } else if (data && typeof data.message === "string" && data.message.trim()) {
        detail = data.message.trim();
      } else if (typeof err.message === "string" && err.message.trim()) {
        detail = err.message.trim();
      }
      setToastTone("error");
      setToast(status ? `Request failed (${status}): ${detail}` : `Request failed: ${detail}`);
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  /** Step 1: close modal, no API. */
  const handleReviewCancel = () => {
    if (purchasing) return;
    closePurchaseModalOnly();
  };

  /** Step 2: Cancel, ×, or overlay → save as PENDING. */
  const handleConfirmCancel = async () => {
    if (purchasing) return;
    if (!selectedItem) return;
    await submitCheckout("PENDING");
  };

  /** Top-level dismiss: depends on current step. */
  const handleModalDismiss = async () => {
    if (purchasing) return;
    if (checkoutStep === "review") {
      handleReviewCancel();
    } else {
      await handleConfirmCancel();
    }
  };

  const goToConfirmationStep = () => {
    setCheckoutStep("confirm");
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Render ──
  return (
    <AppLayout>
      <div className="marketplace-page">

        {/* ══ Header ══ */}
        <div className="marketplace-header">
          <div className="marketplace-title-wrap">
            <h1 className="marketplace-title">🛒 Eco Marketplace</h1>
            <p className="marketplace-subtitle">
              Offset your carbon footprint by supporting verified environmental initiatives. Every purchase makes a real impact.
            </p>
          </div>

          <div className="marketplace-stats">
            <div className="marketplace-stat-chip">
              <span className="marketplace-stat-value">{items.length}</span>
              <span className="marketplace-stat-label">Products</span>
            </div>
            <div className="marketplace-stat-chip">
              <span className="marketplace-stat-value">{totalOffset.toLocaleString()}</span>
              <span className="marketplace-stat-label">kg CO₂ Offset</span>
            </div>
            <div className="marketplace-stat-chip">
              <span className="marketplace-stat-value">₹{totalSpent.toLocaleString("en-IN")}</span>
              <span className="marketplace-stat-label">Total Invested</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="marketplace-loading">
            <div className="marketplace-spinner" />
            <p>Loading marketplace…</p>
          </div>
        ) : (
          <>
            {/* ══ Toolbar ══ */}
            <div className="marketplace-toolbar">
              <div className="marketplace-search-wrap">
                <span className="marketplace-search-icon" aria-hidden>🔍</span>
                <input
                  id="marketplace-search"
                  type="text"
                  className="marketplace-search"
                  placeholder="Search eco initiatives…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="marketplace-category-chips">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`marketplace-chip ${category === cat ? "active" : ""}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat !== "All" && <span>{CATEGORY_META[cat]?.emoji}</span>}
                    {cat}
                    <span className="marketplace-chip-count">
                      {cat === "All" ? items.length : (categoryCounts[cat] || 0)}
                    </span>
                  </button>
                ))}
              </div>

            </div>

            {/* ══ Product Grid ══ */}
            {displayedItems.length === 0 ? (
              <div className="marketplace-empty">
                <span className="marketplace-empty-icon">🔎</span>
                <h3 className="marketplace-empty-title">No items found</h3>
                <p className="marketplace-empty-desc">
                  Try adjusting your search or category filter.
                </p>
              </div>
            ) : (
              <>
                <div className="marketplace-grid">
                {paginatedItems.map((item, index) => {
                  const meta = CATEGORY_META[item.type] || { icon: "🌿", banner: "carbon-offset", emoji: "🌿" };
                  const bannerClass = item.bannerKey || meta.banner;
                  return (
                    <div
                      key={item.id != null ? `mp-${item.id}` : `mp-fallback-${index}-${item.name}`}
                      className="marketplace-card"
                      onClick={() => openPurchaseModal(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openPurchaseModal(item)}
                    >
                      {/* Banner */}
                      <div className={`marketplace-card-banner ${bannerClass}`}>
                        {item.headerIcon || meta.icon}
                      </div>

                      {/* Body */}
                      <div className="marketplace-card-body">
                        <span className="marketplace-card-type">{meta.emoji} {item.type}</span>
                        <h3 className="marketplace-card-name">{item.name}</h3>
                        <p className="marketplace-card-desc">{item.description}</p>

                        <div className="marketplace-card-meta">
                          <span className="marketplace-card-offset">
                            <span className="marketplace-card-offset-icon">🍃</span>
                            {item.carbonOffset} kg CO₂
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="marketplace-card-footer">
                        <span className="marketplace-card-price">
                          ₹{item.price.toLocaleString("en-IN")}
                          <span className="marketplace-card-price-unit">
                            {" "}
                            /{item.priceUnit || "unit"}
                          </span>
                        </span>
                        <button
                          className="marketplace-card-buy-btn"
                          onClick={(e) => { e.stopPropagation(); openPurchaseModal(item); }}
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
                <nav className="marketplace-pagination" aria-label="Marketplace pages">
                  <span className="marketplace-pagination-range">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, displayedItems.length)} of {displayedItems.length}
                  </span>
                  {totalPages > 1 && (
                    <div className="marketplace-pagination-controls">
                      <button
                        type="button"
                        className="marketplace-pagination-nav"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <div className="marketplace-pagination-pages">
                        {pageItems.map((item, idx) =>
                          item === "ellipsis" ? (
                            <span key={`e-${idx}`} className="marketplace-pagination-ellipsis" aria-hidden>
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              className={`marketplace-pagination-page ${page === item ? "active" : ""}`}
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
                        className="marketplace-pagination-nav"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </nav>
              </>
            )}

          </>
        )}

        {/* ══ Purchase Modal ══ */}
        {selectedItem && (
          <div
            className="marketplace-modal-overlay"
            onClick={handleModalDismiss}
            role="dialog"
            aria-modal="true"
            aria-label={
              checkoutStep === "review"
                ? `Review order: ${selectedItem.name}`
                : `Confirm purchase: ${selectedItem.name}`
            }
          >
            <div className="marketplace-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="marketplace-modal-close"
                onClick={handleModalDismiss}
                aria-label="Close"
              >
                ×
              </button>

              <div
                className={`marketplace-modal-banner ${
                  selectedItem.bannerKey || (CATEGORY_META[selectedItem.type] || {}).banner || "carbon-offset"
                }`}
              >
                {selectedItem.headerIcon || (CATEGORY_META[selectedItem.type] || {}).icon || "🌿"}
              </div>

              <div className="marketplace-modal-body">
                {checkoutStep === "review" ? (
                  <>
                    <p className="marketplace-step-badge">Step 1 of 2</p>
                    <p className="marketplace-modal-type">
                      {(CATEGORY_META[selectedItem.type] || {}).emoji} {selectedItem.type}
                    </p>
                    <h2 className="marketplace-modal-name">Review your order</h2>
                    <p className="marketplace-modal-desc">{selectedItem.description}</p>

                    <div className="marketplace-modal-details">
                      <div className="marketplace-modal-detail">
                        <span className="marketplace-modal-detail-label">Item</span>
                        <span className="marketplace-modal-detail-value">{selectedItem.name}</span>
                      </div>
                      <div className="marketplace-modal-detail">
                        <span className="marketplace-modal-detail-label">Price per unit</span>
                        <span className="marketplace-modal-detail-value">₹{selectedItem.price.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="marketplace-modal-detail">
                        <span className="marketplace-modal-detail-label">CO₂ per unit</span>
                        <span className="marketplace-modal-detail-value green">
                          {selectedItem.carbonOffset} kg
                        </span>
                      </div>
                      <div className="marketplace-modal-detail">
                        <span className="marketplace-modal-detail-label">Total offset</span>
                        <span className="marketplace-modal-detail-value green">
                          {(selectedItem.carbonOffset * quantity).toLocaleString()} kg
                        </span>
                      </div>
                    </div>

                    <div className="marketplace-modal-qty">
                      <span className="marketplace-modal-qty-label">Quantity</span>
                      <div className="marketplace-modal-qty-controls">
                        <button
                          type="button"
                          className="marketplace-modal-qty-btn"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                        >
                          −
                        </button>
                        <span className="marketplace-modal-qty-value">{quantity}</span>
                        <button
                          type="button"
                          className="marketplace-modal-qty-btn"
                          onClick={() => setQuantity((q) => q + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="marketplace-modal-total">
                      <span className="marketplace-modal-total-label">Total</span>
                      <span className="marketplace-modal-total-value">
                        ₹{(selectedItem.price * quantity).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="marketplace-modal-actions marketplace-modal-actions-stack">
                      <button
                        type="button"
                        className="marketplace-modal-buy"
                        onClick={goToConfirmationStep}
                        disabled={purchasing}
                      >
                        Continue to confirmation
                      </button>
                      <button
                        type="button"
                        className="marketplace-modal-cancel"
                        onClick={handleReviewCancel}
                        disabled={purchasing}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="marketplace-step-badge">Step 2 of 2 — Confirm</p>
                    <p className="marketplace-modal-type">
                      {(CATEGORY_META[selectedItem.type] || {}).emoji} {selectedItem.type}
                    </p>
                    <h2 className="marketplace-modal-name">Confirm your order</h2>
                    <p className="marketplace-modal-desc">
                      Review offset and totals below. <strong>Confirm</strong> to complete, or <strong>Cancel</strong> to save as pending.
                    </p>

                    <div className="marketplace-confirm-summary">
                      <div className="marketplace-modal-details">
                        <div className="marketplace-modal-detail">
                          <span className="marketplace-modal-detail-label">Item</span>
                          <span className="marketplace-modal-detail-value">{selectedItem.name}</span>
                        </div>
                        <div className="marketplace-modal-detail">
                          <span className="marketplace-modal-detail-label">Quantity</span>
                          <span className="marketplace-modal-detail-value">{quantity}</span>
                        </div>
                        <div className="marketplace-modal-detail">
                          <span className="marketplace-modal-detail-label">CO₂ offset per unit</span>
                          <span className="marketplace-modal-detail-value green">
                            {selectedItem.carbonOffset} kg
                          </span>
                        </div>
                        <div className="marketplace-modal-detail marketplace-confirm-highlight">
                          <span className="marketplace-modal-detail-label">Total CO₂ offset</span>
                          <span className="marketplace-modal-detail-value green">
                            {(selectedItem.carbonOffset * quantity).toLocaleString()} kg
                          </span>
                        </div>
                        <div className="marketplace-modal-detail">
                          <span className="marketplace-modal-detail-label">Price per unit</span>
                          <span className="marketplace-modal-detail-value">
                            ₹{selectedItem.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="marketplace-modal-detail marketplace-confirm-highlight">
                          <span className="marketplace-modal-detail-label">Total amount</span>
                          <span className="marketplace-modal-detail-value">
                            ₹{(selectedItem.price * quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="marketplace-modal-actions marketplace-modal-actions-stack marketplace-confirm-actions">
                      <button
                        type="button"
                        className="marketplace-modal-buy"
                        onClick={() => submitCheckout("SUCCESS")}
                        disabled={purchasing}
                      >
                        {purchasing ? "Processing…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        className="marketplace-modal-cancel"
                        onClick={handleConfirmCancel}
                        disabled={purchasing}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ Toast ══ */}
        {toast && (
          <div className={`marketplace-toast marketplace-toast--${toastTone}`} role="alert">
            <span className="marketplace-toast-icon" aria-hidden>
              {toastTone === "success" ? "✅" : toastTone === "pending" ? "⏳" : "⚠️"}
            </span>
            {toast}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Marketplace;
