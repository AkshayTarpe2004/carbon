import React from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

function ResetPassword() {
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
        <h2>Use OTP to reset password</h2>
        <p className="forgot-password-message">
          We now use a 6-digit OTP for password reset. Please use the Forgot Password flow and enter the OTP sent to your email.
        </p>
        <p className="bottom-text">
          <Link to="/forgot-password">Forgot Password</Link>
          {" · "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
