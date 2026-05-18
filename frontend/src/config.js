const API_ORIGIN = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";

export { API_ORIGIN };
export default API_BASE;
