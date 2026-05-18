import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_BASE from "../config";
import "./Auth.css";

function isValidPassword(pwd) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pwd || "");
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.trim() });
      if (res.data.userFound === false) {
        setError(res.data.message || "No account found with this email. Please register first.");
        return;
      }
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Something went wrong. Try again.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    if (!isValidPassword(newPassword)) {
      setError("Invalid password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data || "Invalid or expired OTP. Request a new one.");
    }
  };

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-box">
          <div className="top-section">
            <h1 className="brand">
              <span className="leaf">🍃</span> Carbon<span>Calc</span>
            </h1>
            <p className="subtitle">Track & Start Reducing Your Emissions</p>
            <hr />
          </div>
          <h2>Password reset</h2>
          <p className="forgot-password-message">Your password has been reset. You can now log in with your new password.</p>
          <p className="bottom-text">
            <Link to="/login">Go to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  if (otpSent) {
    return (
      <div className="auth-wrapper">
        <div className="auth-box">
          <div className="top-section">
            <h1 className="brand">
              <span className="leaf">🍃</span> Carbon<span>Calc</span>
            </h1>
            <p className="subtitle">Track & Start Reducing Your Emissions</p>
            <hr />
          </div>
          <h2>Enter OTP & new password</h2>
          <p className="forgot-password-message">
            A 6-digit OTP has been sent to <strong>{email}</strong>. It is valid for 10 minutes. Please check your inbox and spam folder.
          </p>
          <form onSubmit={handleResetPassword}>
            <label>OTP code</label>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <label>New Password</label>
            <div className="password-field">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
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
            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
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
            {error && <p className="form-error">{error}</p>}
            <button type="submit">Reset password</button>
          </form>
          <p className="bottom-text">
            <button type="button" className="link-button" onClick={() => { setOtpSent(false); setOtp(""); setNewPassword(""); setConfirmPassword(""); setError(""); }}>
              Use a different email
            </button>
            {" · "}
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="top-section">
          <h1 className="brand">
            <span className="leaf">🍃</span> Carbon<span>Calc</span>
          </h1>
          <p className="subtitle">Track & Start Reducing Your Emissions</p>
          <hr />
        </div>
        <h2>Forgot Password</h2>
        <p className="forgot-password-intro">Enter your email and we'll send you a 6-digit OTP to reset your password.</p>
        <form onSubmit={handleSendOtp}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Send OTP</button>
        </form>
        <p className="bottom-text">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
