import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import "./Goals.css";

const API_URL = `${API_BASE}/goals`;
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "transport", label: "Transport" },
  { id: "food", label: "Food" },
  { id: "energy", label: "Energy" },
];

function formatCategoryLabel(categoryId) {
  if (categoryId == null || categoryId === "") return "";
  const id = String(categoryId).toLowerCase();
  const row = CATEGORIES.find((c) => c.id === id);
  return row ? row.label : categoryId;
}

const TIMEFRAMES = [
  { id: "8_days", label: "Next 8 Days" },
  { id: "15_days", label: "Next 15 Days" },
  { id: "30_days", label: "Next 30 Days" },
];

function clampGoalProgress(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

/** Show tenths so values like 12.4% are visible (API may return decimals). */
function formatGoalProgressLabel(p) {
  const v = clampGoalProgress(p);
  const rounded = Math.round(v * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1);
}

const GOAL_STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "expired", label: "Expired" },
];

/** Sidebar list only: `any` = no category filter; `all` = goals with full-footprint category */
const GOAL_LIST_CATEGORY_FILTERS = [
  { id: "any", label: "All types" },
  { id: "all", label: "Full footprint" },
  { id: "transport", label: "Transport" },
  { id: "food", label: "Food" },
  { id: "energy", label: "Energy" },
];

const GOALS_PAGE_SIZE = 2;

/** Page numbers with ellipsis for long ranges (same pattern as Transactions). */
function buildGoalPageItems(totalPages, page) {
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

// const DEMO_GOALS = [
//   {
//     id: "g1",
//     title: "Bike to work 3 times a week",
//     category: "transport",
//     reductionTarget: 20,
//     timeframe: "8_days",
//     recurrence: "weekly",
//     description: "Replace car commutes with cycling or public transport.",
//     createdAt: new Date().toISOString(),
//     status: "active",
//     progress: 25,
//   },
//   {
//     id: "g2",
//     title: "Keep monthly emissions under 300 kg CO₂",
//     category: "energy",
//     reductionTarget: 30,
//     timeframe: "30_days",
//     recurrence: "monthly",
//     description: "Turn off unused lights, optimize AC usage.",
//     createdAt: new Date().toISOString(),
//     status: "active",
//     progress: 40,
//   },
// ];

// function loadGoals() {
//   try {
//     const raw = localStorage.getItem(GOAL_STORAGE_KEY);
//     if (!raw) return DEMO_GOALS;
//     const parsed = JSON.parse(raw);
//     if (!Array.isArray(parsed) || parsed.length === 0) return DEMO_GOALS;
//     return parsed;
//   } catch {
//     return DEMO_GOALS;
//   }
// }

// function saveGoals(goals) {
//   localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goals));
// }

function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("all");
  const [reductionTarget, setReductionTarget] = useState(15);
  const [timeframe, setTimeframe] = useState("8_days");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [goalStatusFilter, setGoalStatusFilter] = useState("all");
  const [goalListCategoryFilter, setGoalListCategoryFilter] = useState("any");
  const [goalsListPage, setGoalsListPage] = useState(1);

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    const onFootprintUpdated = () => {
      fetchGoals();
    };
    window.addEventListener("carboncalc-footprint-updated", onFootprintUpdated);
    return () =>
      window.removeEventListener("carboncalc-footprint-updated", onFootprintUpdated);
  }, []);

const fetchGoals = async () => {
  try {
    const res = await axios.get(API_URL);
    setGoals(res.data);
  } catch (error) {
    console.error("Error fetching goals", error);
  }
};

  const isActive = (g) =>
    String(g.status || "").toUpperCase() === "ACTIVE";
  const isCompleted = (g) =>
    String(g.status || "").toUpperCase() === "COMPLETED";
  const isExpired = (g) =>
    String(g.status || "").toUpperCase() === "EXPIRED";

  const activeGoals = useMemo(
    () => goals.filter(isActive),
    [goals]
  );

  const completedGoals = useMemo(
    () => goals.filter(isCompleted),
    [goals]
  );

  const expiredGoals = useMemo(
    () => goals.filter(isExpired),
    [goals]
  );

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (goalStatusFilter === "active" && !isActive(g)) return false;
      if (goalStatusFilter === "completed" && !isCompleted(g)) return false;
      if (goalStatusFilter === "expired" && !isExpired(g)) return false;
      if (goalListCategoryFilter !== "any") {
        const gc = String(g.category || "").toLowerCase();
        if (gc !== goalListCategoryFilter) return false;
      }
      return true;
    });
  }, [goals, goalStatusFilter, goalListCategoryFilter]);

  const goalsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredGoals.length / GOALS_PAGE_SIZE)),
    [filteredGoals.length]
  );

  useEffect(() => {
    setGoalsListPage(1);
  }, [goalStatusFilter, goalListCategoryFilter]);

  useEffect(() => {
    setGoalsListPage((p) => Math.min(Math.max(1, p), goalsTotalPages));
  }, [goalsTotalPages]);

  const paginatedGoals = useMemo(() => {
    const start = (goalsListPage - 1) * GOALS_PAGE_SIZE;
    return filteredGoals.slice(start, start + GOALS_PAGE_SIZE);
  }, [filteredGoals, goalsListPage]);

  const goalPageItems = useMemo(
    () => buildGoalPageItems(goalsTotalPages, goalsListPage),
    [goalsTotalPages, goalsListPage]
  );

  const handleCreateOrUpdateGoal = async (e) => {
  e.preventDefault();
  setSaveError("");

  const goalData = {
    goalTitle: title.trim(),
    category,
    reductionTarget: Number(reductionTarget),
    timeframe,
    description: description.trim(),
  };

  try {
    if (editingId) {
      await axios.put(`${API_URL}/${editingId}`, goalData);
    } else {
      await axios.post(API_URL, goalData);
      setGoalsListPage(1);
    }

    fetchGoals();
    setEditingId(null);

    setTitle("");
    setCategory("all");
    setReductionTarget(15);
    setTimeframe("8_days");
    setDescription("");
  } catch (error) {
    console.error("Error saving goal", error);
    const data = error.response?.data;
    const msg =
      (typeof data === "string" && data) ||
      data?.message ||
      (Array.isArray(data?.errors) && data.errors[0]) ||
      "Could not save goal. Complete the lifestyle survey first if you have no carbon log yet.";
    setSaveError(msg);
  }
};

  const handleEditGoal = (goal) => {
    setEditingId(goal.id);
    setTitle(goal.goalTitle);
    setCategory(goal.category || "all");
    setReductionTarget(goal.reductionTarget ?? 15);
    setTimeframe(goal.timeframe || "8_days");
    setDescription(goal.description || "");
  };

  const handleDeleteGoal = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    fetchGoals();
  } catch (error) {
    console.error("Error deleting goal", error);
  }
};

  const formatTimeframeLabel = (id) => {
    const option = TIMEFRAMES.find((t) => t.id === id);
    return option ? option.label : "";
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <AppLayout>
      <div className="goals-page">
        <header className="goals-header">
          <div>
            <p className="goals-breadcrumb">Dashboard / Create New Goal</p>
            <h1 className="goals-title">Set a New Sustainability Goal</h1>
          </div>
        </header>

        <div className="goals-layout">
          <section className="goals-main card">
            {saveError && (
              <div
                className="goals-form-section"
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 14,
                }}
              >
                {saveError}
              </div>
            )}
            <form onSubmit={handleCreateOrUpdateGoal} className="goals-form">
              <div className="goals-form-section">
                <label className="goals-label" htmlFor="goal-title">
                  Goal title
                </label>
                <input
                  id="goal-title"
                  type="text"
                  className="goals-input"
                  placeholder="E.g. Bike to work 3 times a week"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="goals-form-section">
                <span className="goals-label">Target category</span>
                <div className="goals-category-grid">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`goals-category-chip ${
                        category === cat.id ? "active" : ""
                      }`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="goals-two-column">
                <div className="goals-form-section">
                  <div className="goals-label-row">
                    <span className="goals-label">Reduction target</span>
                    <span className="goals-label-pill">
                      {reductionTarget}% reduction
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={reductionTarget}
                    onChange={(e) => setReductionTarget(e.target.value)}
                    className="goals-slider"
                  />
                </div>

                <div className="goals-form-section">
                  <label className="goals-label" htmlFor="timeframe">
                    Timeframe
                  </label>
                  <select
                    id="timeframe"
                    className="goals-select"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    {TIMEFRAMES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="goals-form-section">
                <label className="goals-label" htmlFor="goal-description">
                  Optional description
                </label>
                <textarea
                  id="goal-description"
                  className="goals-textarea"
                  rows={4}
                  placeholder="Describe the specific actions you’ll take – e.g. Use public transit on every workday instead of driving."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="goals-form-footer">
                <button type="submit" className="btn btn-primary">
                  {editingId ? "Update goal" : "Save goal"}
                </button>
                {/* <span className="goals-footer-hint">
                  You can edit, complete, or delete goals in the list on the right.
                </span> */}
              </div>
            </form>
          </section>

          <aside className="goals-sidebar">
            <section className="card goals-list-card">
              <div className="goals-list-header">
                <h2 className="goals-sidebar-title">Your Goals</h2>
                <span className="goals-pill">
                  {activeGoals.length} active · {completedGoals.length} completed
                  {expiredGoals.length > 0
                    ? ` · ${expiredGoals.length} expired`
                    : ""}
                </span>
              </div>

              {goals.length > 0 && (
                <div className="goals-filters" aria-label="Filter goals">
                  <div className="goals-filter-stack">
                    <div className="goals-filter-labels-row">
                      <span className="goals-filter-group-label">Status</span>
                      <label
                        className="goals-filter-group-label"
                        htmlFor="goals-list-category-filter"
                      >
                        Category
                      </label>
                    </div>
                    <div className="goals-filter-controls-row">
                      <div className="goals-filter-chips goals-filter-status-chips">
                        {GOAL_STATUS_FILTERS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            className={`goals-category-chip goals-filter-chip ${
                              goalStatusFilter === f.id ? "active" : ""
                            }`}
                            onClick={() => setGoalStatusFilter(f.id)}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <select
                        id="goals-list-category-filter"
                        className="goals-select goals-filter-select goals-inline-category-select"
                        value={goalListCategoryFilter}
                        onChange={(e) =>
                          setGoalListCategoryFilter(e.target.value)
                        }
                      >
                        {GOAL_LIST_CATEGORY_FILTERS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(goalStatusFilter !== "all" ||
                    goalListCategoryFilter !== "any") && (
                    <p className="goals-filter-summary">
                      Showing {filteredGoals.length} of {goals.length}
                    </p>
                  )}
                </div>
              )}

              {goals.length === 0 && (
                <p className="goals-empty">
                  No goals yet. Create your first reduction target to get
                  started.
                </p>
              )}

              {goals.length > 0 && filteredGoals.length === 0 && (
                <p className="goals-empty">
                  No goals match these filters. Try widening status or category.
                </p>
              )}

              {goals.length > 0 && filteredGoals.length > 0 && (
                <>
                <div className="goals-list">
                  {paginatedGoals.map((goal) => (
                    <article
                      key={goal.id}
                      className={`goals-list-item goals-list-item-${
                        isCompleted(goal)
                          ? "completed"
                          : isExpired(goal)
                            ? "expired"
                            : "active"
                      }`}
                    >
                      <header className="goals-list-item-header">
                        <h3 className="goals-list-title">{goal.goalTitle}</h3>
                        <div className="goals-list-actions">
                          <span className="goals-list-status">
                            {isCompleted(goal)
                              ? "Completed"
                              : isExpired(goal)
                                ? "Expired"
                                : "Active"}
                          </span>
                          {/* <button
                            type="button"
                            className="goals-list-btn goals-list-btn-edit"
                            onClick={() => handleEditGoal(goal)}
                          >
                            Edit
                          </button> */}
                          <button
                            type="button"
                            className="goals-list-btn goals-list-btn-delete"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </header>
                      <p className="goals-list-meta">
                        <span>{formatCategoryLabel(goal.category)}</span> ·{" "}
                        <span>
                          {goal.reductionTarget}% of{" "}
                          {String(goal.category || "").toLowerCase() === "all"
                            ? "full footprint baseline"
                            : "category baseline"}
                        </span>{" "}
                        · <span>{formatTimeframeLabel(goal.timeframe)}</span>
                      </p>
                      {(goal.startDate || goal.endDate) && (
                        <p
                          className="goals-list-description"
                          style={{ fontSize: 12, marginTop: 2 }}
                        >
                          {goal.startDate && goal.endDate
                            ? `Progress window: ${formatDate(goal.startDate)} – ${formatDate(goal.endDate)}`
                            : goal.endDate
                              ? `Through ${formatDate(goal.endDate)}`
                              : `From ${formatDate(goal.startDate)}`}
                        </p>
                      )}
                      {goal.baselineEmission != null && (
                        <p className="goals-list-description" style={{ fontSize: 13 }}>
                          Baseline:{" "}
                          <strong>
                            {Number(goal.baselineEmission).toFixed(2)} kg CO₂
                          </strong>
                          {" · "}
                          Target cut:{" "}
                          <strong>
                            {Number(goal.targetReductionKg ?? 0).toFixed(2)} kg
                          </strong>
                          {" · "}
                          Achieved:{" "}
                          <strong>
                            {Number(goal.currentReductionKg ?? 0).toFixed(2)} kg
                          </strong>
                        </p>
                      )}
                      {goal.description && (
                        <p className="goals-list-description">
                          {goal.description}
                        </p>
                      )}
                      <div className="goals-progress-wrap">
                        <div className="goals-progress-label-row">
                          <span>Progress</span>
                          <span>{formatGoalProgressLabel(goal.progressPercentage)}%</span>
                        </div>
                        <div className="goals-progress-bar">
                          <div
                            className="goals-progress-bar-fill"
                            style={{
                              width: `${clampGoalProgress(goal.progressPercentage)}%`,
                            }}
                          />
                        </div>
                        {isCompleted(goal) && (
                          <p className="goals-completed-label">
                            Nice work! This goal has reached 100% completion.
                          </p>
                        )}
                        {isExpired(goal) && (
                          <p className="goals-expired-label">
                            This goal ended before reaching 100% progress.
                          </p>
                        )}
                      </div>
                      <p className="goals-list-footer">
                        Created on {formatDate(goal.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
                <nav className="goals-pagination" aria-label="Goals list pages">
                  <span className="goals-pagination-range">
                    Showing {(goalsListPage - 1) * GOALS_PAGE_SIZE + 1}–
                    {Math.min(
                      goalsListPage * GOALS_PAGE_SIZE,
                      filteredGoals.length
                    )}{" "}
                    of {filteredGoals.length}
                  </span>
                  {goalsTotalPages > 1 && (
                    <div className="goals-pagination-controls">
                      <button
                        type="button"
                        className="goals-pagination-nav"
                        disabled={goalsListPage <= 1}
                        onClick={() =>
                          setGoalsListPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Previous
                      </button>
                      <div className="goals-pagination-pages">
                        {goalPageItems.map((item, idx) =>
                          item === "ellipsis" ? (
                            <span
                              key={`e-${idx}`}
                              className="goals-pagination-ellipsis"
                              aria-hidden
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              className={`goals-pagination-page ${
                                goalsListPage === item ? "active" : ""
                              }`}
                              onClick={() => setGoalsListPage(item)}
                              aria-current={
                                goalsListPage === item ? "page" : undefined
                              }
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        className="goals-pagination-nav"
                        disabled={goalsListPage >= goalsTotalPages}
                        onClick={() =>
                          setGoalsListPage((p) =>
                            Math.min(goalsTotalPages, p + 1)
                          )
                        }
                      >
                        Next
                      </button>
                    </div>
                  )}
                </nav>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

export default Goals;

