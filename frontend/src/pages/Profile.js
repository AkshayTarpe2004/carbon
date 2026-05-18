import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken, isUnauthorizedResponse, clearStoredToken } from "../utils/auth";
import "./Profile.css";

function isValidPassword(pwd) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pwd || "");
}

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && (res.data.name != null || res.data.email != null)) {
          setName(res.data.name ?? "");
          setEmail(res.data.email ?? "");
        }
      } catch (err) {
        if (isUnauthorizedResponse(err)) {
          clearStoredToken();
          navigate("/login");
          return;
        }
        setName("");
        setEmail("");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});

    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      setErrors((prev) => ({ ...prev, name: "Please enter your name." }));
      return;
    }
    const trimmedEmail = (email || "").trim();
    if (!trimmedEmail) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email." }));
      return;
    }
    if (password || confirmPassword) {
      if (!password) {
        setErrors((prev) => ({ ...prev, password: "Please enter a new password." }));
        return;
      }
      if (!isValidPassword(password)) {
        setErrors((prev) => ({ ...prev, password: "Use at least 8 characters with letters, numbers and one special character (@$!%*#?&)." }));
        return;
      }
      if (password !== confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { name: trimmedName, email: trimmedEmail };
      if (password) payload.password = password;
      await axios.put(`${API_BASE}/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
  navigate("/dashboard");
}, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data;
      setMessage({
        type: "error",
        text: (msg && typeof msg === "string" ? msg : "Update failed. Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="profile-page">
          <p className="profile-loading">Loading profile…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="profile-page">
        <p className="profile-welcome">Welcome back, <strong>{name || "User"}</strong></p>
        <h1 className="profile-title">Profile</h1>
        <p className="profile-desc">Update your account details. Leave password blank to keep your current password.</p>

        {message.text && (
          <div className={`profile-message profile-message-${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        <form className="profile-form card" onSubmit={handleSubmit}>
          <label className="profile-label">
            Full Name
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
              className="profile-input"
              aria-invalid={!!errors.name}
            />
            {errors.name && <span className="profile-error">{errors.name}</span>}
          </label>

          {/* <label className="profile-label">
            Email Address
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
              className="profile-input"
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className="profile-error">{errors.email}</span>}
          </label> */}

          <label className="profile-label">
            New Password <span className="profile-label-optional">(leave blank to keep current)</span>
            <div className="profile-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: "" })); }}
                className="profile-input"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <span className="profile-error">{errors.password}</span>}
          </label>

          <label className="profile-label">
            Confirm New Password
            <div className="profile-password-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                className="profile-input"
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && <span className="profile-error">{errors.confirmPassword}</span>}
          </label>

          <div className="profile-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default Profile;
