import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE from "../config";
import { setStoredAuth, authRedirectPath } from "../utils/auth";
import "./Auth.css";

function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");
    const maintenanceStart = params.get("maintenanceStart");
    const maintenanceEnd = params.get("maintenanceEnd");

    if (error === "maintenance") {
      const qp = new URLSearchParams({ maintenance: "1" });
      if (maintenanceStart) qp.set("maintenanceStart", maintenanceStart);
      if (maintenanceEnd) qp.set("maintenanceEnd", maintenanceEnd);
      navigate(`/login?${qp.toString()}`);
      return;
    }

    if (error === "blocked") {
      navigate("/login?blocked=1");
      return;
    }

    if (token) {
      setStoredAuth(token, null);
      const headers = { Authorization: `Bearer ${token}` };
      const t = setTimeout(() => {
        axios
          .get(`${API_BASE}/auth/me`, { headers })
          .then((res) => {
            const role = res.data?.role;
            setStoredAuth(token, role);
            navigate(authRedirectPath(role));
          })
          .catch(() => navigate("/dashboard"));
      }, 1000);
      return () => clearTimeout(t);
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>Signing you in…</h2>
        <p>Please wait while we complete your login.</p>
      </div>
    </div>
  );
}

export default OAuth2RedirectHandler;
