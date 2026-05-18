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
  stripAuthHeader,
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

/** Per-request auth: strip JWT on public routes; attach fresh token on protected routes. */
function applyAuthInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const url = resolveRequestUrl(config);

    if (!shouldAttachAuthHeader(url)) {
      stripAuthHeader(config);
      return config;
    }

    const token = readValidToken();
    if (!token) {
      stripAuthHeader(config);
      return config;
    }

    attachAuthHeader(config, token);
    return config;
  });
}

export function bootstrapAuthFromStorage() {
  syncAxiosAuth(null);
}

export function configureHttpAuth() {
  bootstrapAuthFromStorage();
  applyAuthInterceptor(axios);
}

configureHttpAuth();

export default axios;
