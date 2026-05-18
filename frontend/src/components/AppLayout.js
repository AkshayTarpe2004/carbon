import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import API_BASE from "../config";
import {
  isAdminRole as checkAdminRole,
  emailFromToken,
  displayNameFromEmail,
  getStoredRole,
  clearStoredToken,
} from "../utils/auth";
import "./AppLayout.css";

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [user, setUser] = useState({ name: "", role: getStoredRole() || "USER", avatar: null });
  const currentAdminTab = new URLSearchParams(location.search).get("tab") || "analytics";
  const roleKey = (user.role || "USER").trim().toUpperCase();
  const isAdmin = checkAdminRole(user.role);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const applyProfile = (data) => {
      if (!data) return;
      const email = data.email || emailFromToken(token);
      const name =
        (data.name && String(data.name).trim()) ||
        (email ? displayNameFromEmail(email) : "User");
      const role = (data.role || "USER").trim().toUpperCase();
      setUser({
        name,
        role,
        avatar: data.avatar || null,
      });
      localStorage.setItem("role", role);
    };

    axios
      .get(`${API_BASE}/auth/me`, { headers })
      .then((res) => applyProfile(res.data))
      .catch(() =>
        axios
          .get(`${API_BASE}/users/me`, { headers })
          .then((res) => applyProfile(res.data))
          .catch(() => {
            const email = emailFromToken(token);
            setUser({
              name: email ? displayNameFromEmail(email) : "User",
              role: "USER",
              avatar: null,
            });
          })
      );
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token && isAdmin) {
      try {
        await axios.post(
          `${API_BASE}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        /* still sign out locally */
      }
    }
    clearStoredToken();
    navigate("/");
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <span className="app-sidebar-logo-icon" aria-hidden>🌿</span>
          <span className="app-sidebar-logo-text">CarbonCalc</span>
        </div>
        <nav className="app-sidebar-nav">

          {/* USER FEATURES */}
          {!isAdmin && (
            <>
              <NavLink to="/dashboard" className="app-nav-item" end>
                <span className="app-nav-icon">◉</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/survey" className="app-nav-item">
                <span className="app-nav-icon">📋</span>
                <span>Lifestyle Survey</span>
              </NavLink>

              <NavLink to="/carbon-history" className="app-nav-item">
                <span className="app-nav-icon">🕐</span>
                <span>Carbon History</span>
              </NavLink>

              <NavLink to="/goals" className="app-nav-item">
                <span className="app-nav-icon">🎯</span>
                <span>Goals</span>
              </NavLink>

              <NavLink to="/badges" className="app-nav-item">
                <span className="app-nav-icon">🏅</span>
                <span>My Badges</span>
              </NavLink>

              <NavLink to="/leaderboard" className="app-nav-item">
                <span className="app-nav-icon">🏆</span>
                <span>Leaderboard</span>
              </NavLink>

              <NavLink to="/marketplace" className="app-nav-item">
                <span className="app-nav-icon">🛒</span>
                <span>Eco Marketplace</span>
              </NavLink>

              <NavLink to="/transactions" className="app-nav-item">
                <span className="app-nav-icon">💳</span>
                <span>Transactions</span>
              </NavLink>

              <NavLink to="/notifications" className="app-nav-item">
                <span className="app-nav-icon">🔔</span>
                <span>Notifications</span>
              </NavLink>
            </>
          )}

          {/* ADMIN FEATURES */}
          {isAdmin && (
            <>
              <NavLink
                to="/AdminDashboard?tab=analytics"
                className={() => `app-nav-item ${currentAdminTab === "analytics" ? "active" : ""}`}
                end
              >
                <span className="app-nav-icon">🛡️</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=users"
                className={() => `app-nav-item ${currentAdminTab === "users" ? "active" : ""}`}
              >
                <span className="app-nav-icon">👥</span>
                <span>Users</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=goals"
                className={() => `app-nav-item ${currentAdminTab === "goals" ? "active" : ""}`}
              >
                <span className="app-nav-icon">🎯</span>
                <span>Goals</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=badges"
                className={() => `app-nav-item ${currentAdminTab === "badges" ? "active" : ""}`}
              >
                <span className="app-nav-icon">🏅</span>
                <span>Badges</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=leaderboard"
                className={() => `app-nav-item ${currentAdminTab === "leaderboard" ? "active" : ""}`}
              >
                <span className="app-nav-icon">🏆</span>
                <span>Leaderboard</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=marketplace"
                className={() => `app-nav-item ${currentAdminTab === "marketplace" ? "active" : ""}`}
              >
                <span className="app-nav-icon">🛒</span>
                <span>Marketplace</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=transactions"
                className={() => `app-nav-item ${currentAdminTab === "transactions" ? "active" : ""}`}
              >
                <span className="app-nav-icon">💳</span>
                <span>Transactions</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=notifications"
                className={() => `app-nav-item ${currentAdminTab === "notifications" ? "active" : ""}`}
              >
                <span className="app-nav-icon">🔔</span>
                <span>Notifications</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=contact-inbox"
                className={() => `app-nav-item ${currentAdminTab === "contact-inbox" ? "active" : ""}`}
              >
                <span className="app-nav-icon">✉️</span>
                <span>Contact</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=admin-logs"
                className={() => `app-nav-item ${currentAdminTab === "admin-logs" ? "active" : ""}`}
              >
                <span className="app-nav-icon">🧾</span>
                <span>Admin Logs</span>
              </NavLink>

              <NavLink
                to="/AdminDashboard?tab=settings"
                className={() => `app-nav-item ${currentAdminTab === "settings" ? "active" : ""}`}
              >
                <span className="app-nav-icon">⚙</span>
                <span>Settings</span>
              </NavLink>
            </>
          )}
        </nav>
        <div className="app-sidebar-footer">
          {/* <a href="#settings" className="app-nav-item app-nav-item-util">
            <span className="app-nav-icon">⚙</span>
            <span>Settings</span>
          </a> */}
          <button type="button" className="app-nav-item app-nav-item-util app-nav-logout" onClick={handleLogout}>
            <span className="app-nav-icon">↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <p className="app-header-welcome">
            Welcome back, <strong>{user.name || "User"}</strong>
          </p>
          <div className="app-header-actions">
            <div className="app-header-profile-wrap" ref={profileRef}>
              <button
                type="button"
                className="app-header-profile-trigger"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label="Open profile menu"
              >
                <div className="app-header-avatar">
                  {user.avatar ? <img src={user.avatar} alt="" /> : <span>{(user.name || "U").charAt(0)}</span>}
                </div>
                <div className="app-header-user-text">
                  <span className="app-header-user-name">{user.name || "User"}</span>
                  <span className="app-header-user-role">{roleKey === "ADMIN" ? "Admin" : "User"}</span>
                </div>
                <span className="app-header-profile-chevron" aria-hidden>▾</span>
              </button>
              {profileOpen && (
                <div className="app-header-profile-dropdown" role="menu">
                  <button type="button" className="app-header-dropdown-item" role="menuitem" onClick={() => { setProfileOpen(false); navigate("/profile"); }}>
                    Profile
                  </button>
                  <button type="button" className="app-header-dropdown-item app-header-dropdown-item-logout" role="menuitem" onClick={() => { setProfileOpen(false); handleLogout(); }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>

        <footer className="app-footer">
          
          <span>© 2026 CarbonCalc. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
