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

export function clearStoredToken() {
  localStorage.removeItem("token");
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
