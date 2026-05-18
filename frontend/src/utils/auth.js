/** True when the API rejected credentials (not network/CORS/500). */
export function isUnauthorizedResponse(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
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

export function authRedirectPath(role) {
  return isAdminRole(role) ? "/AdminDashboard" : "/dashboard";
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
