import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import MarketingHeader from "../components/MarketingHeader";
import API_BASE, { API_ORIGIN } from "../config";
import { isAdminRole } from "../utils/auth";
import "./Auth.css";

function buildMaintenanceMessage(start, end) {
  const s = (start || "").trim();
  const e = (end || "").trim();
  if (!s && !e) {
    return "The application is currently in maintenance mode. Please try again later.";
  }
  return `The application is currently in maintenance mode (${s || "now"} to ${
    e || "until further notice"
  }). Please try again later.`;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [oauthEnabled, setOauthEnabled] = useState({ google: true, github: true });
  const [notification, setNotification] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const isMaintenanceNotification =
    notification.message &&
    notification.message.toLowerCase().includes("maintenance mode");

  useEffect(() => {
    axios
      .get(`${API_BASE}/auth/oauth-enabled`)
      .then((res) => {
        setOauthEnabled(res.data);
      })
      .catch(() => {
        // If the feature flag endpoint is missing or fails,
        // fall back to showing the social buttons.
        setOauthEnabled({ google: true, github: true });
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("maintenance") === "1") {
      const start = params.get("maintenanceStart") || "";
      const end = params.get("maintenanceEnd") || "";
      setNotification({
        type: "error",
        message: buildMaintenanceMessage(start, end),
      });
      return;
    }

    if (params.get("blocked") === "1") {
      setNotification({
        type: "error",
        message: "Your account has been blocked. Please contact support.",
      });
    }
  }, [location.search]);

  const handleGoogleLogin = () => {
    localStorage.removeItem("token");
    window.location.href = `${API_ORIGIN}/oauth2/authorization/google`;
  };

  const handleGithubLogin = () => {
    localStorage.removeItem("token");
    window.location.href = `${API_ORIGIN}/oauth2/authorization/github`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Always hide the password again when submitting the form
    setShowPassword(false);
    setNotification({ type: "", message: "" });
    setErrors({ email: "", password: "" });

    const trimmedEmail = (email || "").trim();
    if (!trimmedEmail) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email address." }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Please enter your password." }));
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/auth/login`,
        { email: trimmedEmail, password },
        { maxRedirects: 0 }
      );
      const token = response.data.token;
      const role = response.data.role;
      const admin = isAdminRole(role);

      localStorage.setItem("token", token);

      // Extra guard: during maintenance, block non-admin even after successful auth.
      if (!admin) {
        try {
          const settingsRes = await axios.get(`${API_BASE}/admin/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const maintenanceMode = Boolean(settingsRes?.data?.maintenanceMode);
          if (maintenanceMode) {
            localStorage.removeItem("token");
            setNotification({
              type: "error",
              message: buildMaintenanceMessage(
                settingsRes?.data?.maintenanceStart,
                settingsRes?.data?.maintenanceEnd
              ),
            });
            return;
          }
        } catch {
          // If settings check fails, continue with normal login flow.
        }
      }

      setNotification({ type: "success", message: "Login successful. Redirecting..." });

      setTimeout(() => {
        if (admin) {
          navigate("/AdminDashboard");
        } else {
          navigate("/dashboard");
        }
      }, 800);
    } catch (err) {
      const msg = err.response?.data;
      const status = err.response?.status;
      const location = err.response?.headers?.location || "";
      const isBackendRedirect =
        status === 302 ||
        status === 301 ||
        err.code === "ERR_TOO_MANY_REDIRECTS" ||
        String(location).includes("/login") ||
        String(err.message || "").toLowerCase().includes("redirect");
      setNotification({
        type: "error",
        message: isBackendRedirect
          ? "Backend must be redeployed on Render (login API is redirecting to /login instead of returning JSON). Push the latest backend code to deployment-r6qc, then try again."
          : msg || "Invalid email or password.",
      });
    }
  };

  return (
    <div className="auth-page">
      <MarketingHeader />
      <div className="auth-page-main">
        <div className="auth-wrapper">
          <div className="auth-box auth-box--split">
            <div className="auth-split">
              <aside className="auth-panel auth-panel--visual">
                <div className="auth-visual-blob auth-visual-blob--a" aria-hidden />
                <div className="auth-visual-blob auth-visual-blob--b" aria-hidden />
                <div className="auth-visual-inner">
                  <div className="top-section">
                    <h1 className="brand">
                      <span className="leaf">🍃</span> Carbon<span>Calc</span>
                    </h1>
                    <p className="subtitle">Track &amp; Start Reducing Your Emissions</p>
                    <hr />
                  </div>
                  <div className="bottom-image" aria-hidden>
                    🌞 🌳 🌿
                  </div>
                </div>
              </aside>

              <div className="auth-panel auth-panel--form">
        <h2>Login to Your Account</h2>

        {notification.message && (
          <div className={`notification ${isMaintenanceNotification ? "maintenance" : notification.type}`}>
            {notification.message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            type="email"
            className={errors.email ? "input-error" : ""}
            placeholder="Enter email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
          />
          {errors.email && (
            <p className="form-error form-error--friendly" role="alert">
              <span className="form-error-icon" aria-hidden>!</span>
              <span>{errors.email}</span>
            </p>
          )}

          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              className={errors.password ? "input-error" : ""}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="form-error form-error--friendly" role="alert">
              <span className="form-error-icon" aria-hidden>!</span>
              <span>{errors.password}</span>
            </p>
          )}

          <div className="forgot">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit">Login</button>
        </form>

        {(oauthEnabled.google || oauthEnabled.github) && (
          <>
            <div className="social-login">
              <p className="social-or">or continue with</p>
              <div className="social-buttons-row">
                {oauthEnabled.google && (
                  <button
                    type="button"
                    className="social-btn google"
                    onClick={handleGoogleLogin}
                    title="Sign in with Google"
                  >
                    <span className="social-icon" aria-hidden>
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </span>
                    Google
                  </button>
                )}
                {oauthEnabled.github && (
                  <button
                    type="button"
                    className="social-btn github"
                    onClick={handleGithubLogin}
                    title="Sign in with GitHub"
                  >
                    <span className="social-icon" aria-hidden>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </span>
                    GitHub
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <hr className="divider" />

        <p className="bottom-text">
          Don’t have an account? <Link to="/register">Sign Up</Link>
        </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="auth-footer" style={{ textAlign: "center", padding: "1.5rem", color: "#666", fontSize: "0.875rem", marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} CarbonCalc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Login;
