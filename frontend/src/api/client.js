/**
 * Shared axios instance — loads before the app so every request sends the saved JWT
 * until the user clicks Logout.
 */
import axios from "axios";
import API_BASE from "../config";
import {
  attachAuthHeader,
  getStoredToken,
  shouldAttachAuthHeader,
  syncAxiosAuth,
} from "../utils/auth";

function resolveRequestUrl(config) {
  const raw = config.url || "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = (config.baseURL || API_BASE || "").replace(/\/$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}

function readValidToken() {
  const token = (getStoredToken() || "").trim();
  if (!token || token === "null" || token === "undefined") return null;
  return token;
}

/** Attach JWT from localStorage on every protected request (overwrites bad headers). */
function applyAuthInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const url = resolveRequestUrl(config);
    if (!shouldAttachAuthHeader(url)) return config;
    const token = readValidToken();
    if (!token) return config;
    attachAuthHeader(config, token);
    return config;
  });
}

export function bootstrapAuthFromStorage() {
  const token = readValidToken();
  if (token) syncAxiosAuth(token);
}

export function configureHttpAuth() {
  bootstrapAuthFromStorage();
  applyAuthInterceptor(axios);
}

configureHttpAuth();

export default axios;
