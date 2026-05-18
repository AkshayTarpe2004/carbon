/** True when the session/token was rejected (401 only — not 403 forbidden). */
export function isUnauthorizedResponse(error) {
  return error?.response?.status === 401;
}

/** Attach Bearer token to axios config (works with AxiosHeaders and plain objects). */
export function attachAuthHeader(config, token) {
  if (!token) return config;
  const value = `Bearer ${token}`;
  if (!config.headers) {
    config.headers = { Authorization: value };
    return config;
  }
  if (typeof config.headers.set === "function") {
    config.headers.set("Authorization", value);
  } else {
    config.headers.Authorization = value;
  }
  return config;
}

/** Client-side expiry check — avoids sending dead tokens that trigger logout cascades. */
export function isTokenExpired(token) {
  if (!token || typeof token !== "string") return true;
  try {
    const base64 = token.split(".")[1];
    if (!base64) return true;
    const json = JSON.parse(
      atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const exp = json?.exp;
    if (typeof exp !== "number") return false;
    return exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export function hasValidSession() {
  const token = getStoredToken();
  return Boolean(token) && !isTokenExpired(token);
}

export function isAdminRole(role) {
  return (role || "").trim().toUpperCase() === "ADMIN";
}

export function getStoredToken() {
  return localStorage.getItem("token");
}

export function getStoredRole() {
  const role = localStorage.getItem("role");
  return role ? role.trim().toUpperCase() : null;
}

export function setStoredAuth(token, role) {
  if (token) {
    localStorage.setItem("token", token);
  }
  if (role != null && String(role).trim()) {
    localStorage.setItem("role", String(role).trim().toUpperCase());
  }
}

export function clearStoredToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

/** Do not attach JWT to public auth endpoints (avoids CORS preflight on login/register). */
export function shouldAttachAuthHeader(url) {
  if (!url || typeof url !== "string") return true;
  const path = url.replace(/^https?:\/\/[^/]+/i, "");
  const publicAuthPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/register/send-otp",
    "/auth/register/verify-otp",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/oauth-enabled",
  ];
  return !publicAuthPaths.some((p) => path.includes(p));
}

export function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function authRedirectPath(role) {
  return isAdminRole(role) ? "/admin" : "/dashboard";
}

export function describeApiError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return "Cannot reach the server. Check your connection and that the backend is running.";
  }
  const status = err.response?.status;
  const data = err.response?.data;
  const detail =
    typeof data === "string"
      ? data
      : data?.message || data?.error || (typeof data === "object" ? null : data);
  if (status === 403 && detail) return detail;
  if (status === 401) return detail || "Invalid email or password.";
  if (status === 400 && detail) return detail;
  if (detail) return String(detail);
  return fallback;
}

/** Read JWT subject (email) without verifying — display fallback only. */
export function emailFromToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = JSON.parse(
      atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const sub = json?.sub;
    return sub && String(sub).trim() ? String(sub).trim() : null;
  } catch {
    return null;
  }
}

export function displayNameFromEmail(email) {
  if (!email || !email.includes("@")) return email || "User";
  const local = email.split("@")[0];
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
