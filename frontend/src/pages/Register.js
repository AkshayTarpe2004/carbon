import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import MarketingHeader from "../components/MarketingHeader";
import API_BASE, { API_ORIGIN } from "../config";
import "./Auth.css";

const STEP_EMAIL = 0;
const STEP_OTP = 1;
const STEP_DETAILS = 2;

function isValidPassword(pwd) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pwd || "");
}

/** Matches server-side registration check: sensible format before requesting an OTP. */
function isValidEmailFormat(email) {
  const t = (email || "").trim();
  return /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(t);
}

function parseApiError(err) {
  const data = err.response?.data;
  if (data == null) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (typeof data.message === "string") return data.message;
  return "Something went wrong. Please try again.";
}

function isEmailAlreadyTakenMessage(msg) {
  const lower = (msg || "").toLowerCase();
  return (
    lower.includes("already present") ||
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("an account with this email")
  );
}

function mapSendOtpError(err) {
  const msg = parseApiError(err);
  if (isEmailAlreadyTakenMessage(msg)) {
    return {
      kind: "exists",
      field: "email",
      message:
        "This email is already present. Log in or use a different email address.",
    };
  }
  const lower = msg.toLowerCase();
  if (lower.includes("valid email")) {
    return { kind: "invalid", field: "email", message: msg };
  }
  return { kind: "other", field: "form", message: msg };
}

function Register() {
  const [step, setStep] = useState(STEP_EMAIL);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [oauthEnabled, setOauthEnabled] = useState({ google: true, github: true });
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    terms: "",
    form: "",
  });
  const [modal, setModal] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submittingRegister, setSubmittingRegister] = useState(false);
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/auth/oauth-enabled`)
      .then((res) => {
        setOauthEnabled(res.data);
      })
      .catch(() => {
        setOauthEnabled({ google: true, github: true });
      });
  }, []);

  const handleGoogleLogin = () => {
    localStorage.removeItem("token");
    window.location.href = `${API_ORIGIN}/oauth2/authorization/google`;
  };

  const handleGithubLogin = () => {
    localStorage.removeItem("token");
    window.location.href = `${API_ORIGIN}/oauth2/authorization/github`;
  };

  const clearErrors = () => {
    setEmailAlreadyRegistered(false);
    setErrors({ name: "", email: "", otp: "", password: "", confirmPassword: "", terms: "", form: "" });
  };

  const sendOtpToEmail = async (emailToSend) => {
    const res = await axios.post(`${API_BASE}/auth/register/send-otp`, {
      email: emailToSend,
    });
    return res.data?.message || "Check your email for the code.";
  };

  const handleSendOtp = async () => {
    setNotification({ type: "", message: "" });
    clearErrors();
    const trimmedEmail = (email || "").trim();
    if (!trimmedEmail) {
      setErrors((e) => ({ ...e, email: "Please enter your email address." }));
      return;
    }
    if (!isValidEmailFormat(trimmedEmail)) {
      setErrors((e) => ({
        ...e,
        email: "Enter a valid email address (e.g. name@example.com).",
      }));
      return;
    }
    setSendingOtp(true);
    try {
      const msg = await sendOtpToEmail(trimmedEmail);
      setNotification({ type: "success", message: msg });
      setStep(STEP_OTP);
      setOtp("");
    } catch (err) {
      const mapped = mapSendOtpError(err);
      if (mapped.kind === "exists") {
        setEmailAlreadyRegistered(true);
        setErrors((e) => ({ ...e, email: "", form: "" }));
      } else if (mapped.field === "email") {
        setErrors((e) => ({ ...e, email: mapped.message, form: "" }));
      } else {
        setErrors((e) => ({ ...e, form: mapped.message }));
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    const trimmedEmail = (email || "").trim();
    if (!trimmedEmail) return;
    setSendingOtp(true);
    setNotification({ type: "", message: "" });
    clearErrors();
    try {
      const msg = await sendOtpToEmail(trimmedEmail);
      setNotification({ type: "success", message: msg });
    } catch (err) {
      const mapped = mapSendOtpError(err);
      if (mapped.kind === "exists") {
        setEmailAlreadyRegistered(true);
        setStep(STEP_EMAIL);
        setErrors((e) => ({ ...e, email: "", form: "" }));
      } else if (mapped.field === "email") {
        setErrors((e) => ({ ...e, email: mapped.message, form: "" }));
      } else {
        setErrors((e) => ({ ...e, form: mapped.message }));
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setNotification({ type: "", message: "" });
    clearErrors();
    const trimmedEmail = (email || "").trim();
    const trimmedOtp = (otp || "").trim();
    if (!trimmedOtp) {
      setErrors((e) => ({ ...e, otp: "Enter the 6-digit code from your email." }));
      return;
    }
    setVerifyingOtp(true);
    try {
      await axios.post(`${API_BASE}/auth/register/verify-otp`, {
        email: trimmedEmail,
        otp: trimmedOtp,
      });
      setNotification({ type: "success", message: "Email verified. Enter your details below." });
      setStep(STEP_DETAILS);
    } catch (err) {
      const msg = parseApiError(err);
      if (isEmailAlreadyTakenMessage(msg)) {
        setEmailAlreadyRegistered(true);
        setStep(STEP_EMAIL);
        setOtp("");
        setErrors((e) => ({ ...e, otp: "", form: "" }));
      } else {
        setErrors((e) => ({ ...e, otp: msg }));
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(STEP_EMAIL);
    setOtp("");
    setNotification({ type: "", message: "" });
    clearErrors();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotification({ type: "", message: "" });
    clearErrors();

    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim();

    if (!trimmedName) {
      setErrors((er) => ({ ...er, name: "Please enter your name." }));
      return;
    }
    if (!trimmedEmail) {
      setErrors((er) => ({ ...er, email: "Please enter your email address." }));
      return;
    }
    if (!password) {
      setErrors((er) => ({ ...er, password: "Please enter a password." }));
      return;
    }
    if (!confirmPassword) {
      setErrors((er) => ({ ...er, confirmPassword: "Please confirm your password." }));
      return;
    }
    if (!isValidPassword(password)) {
      setErrors((er) => ({
        ...er,
        password: "Use at least 8 characters with letters, numbers and one special character (@$!%*#?&).",
      }));
      return;
    }
    if (password !== confirmPassword) {
      setErrors((er) => ({ ...er, confirmPassword: "Passwords do not match." }));
      return;
    }
    if (!acceptedTerms) {
      setErrors((er) => ({
        ...er,
        terms: "Please read and agree to the Terms & Conditions and Privacy Policy.",
      }));
      return;
    }
    setSubmittingRegister(true);
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      setNotification({ type: "success", message: "Registration successful. Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const msg = parseApiError(err);
      const friendlyMsg = isEmailAlreadyTakenMessage(msg)
        ? "This email is already present. Log in or use a different email address."
        : msg;
      setErrors((er) => ({ ...er, form: friendlyMsg }));
    } finally {
      setSubmittingRegister(false);
    }
  };

  const stepTitles = ["Your email", "Verify email", "Your details"];

  return (
    <div className="auth-page">
      <MarketingHeader />
      <div className="auth-page-main">
        <div className="auth-wrapper">
          <div className="auth-box auth-box--split">
            <div className="auth-split">
              <aside className="auth-panel auth-panel--visual">
                <div className="auth-visual-blob auth-visual-blob--a" aria-hidden />
                <div className="auth-visual-blob auth-visual-blob--b" aria-hidden />
                <div className="auth-visual-inner">
                  <div className="top-section">
                    <h1 className="brand">
                      <span className="leaf">🍃</span> Carbon<span>Calc</span>
                    </h1>
                    <p className="subtitle">Join &amp; Start Reducing Your Emissions</p>
                    <hr />
                  </div>
                  <div className="bottom-image" aria-hidden>
                    🌞 🌳 🌿
                  </div>
                </div>
              </aside>

              <div className="auth-panel auth-panel--form">
                <h2>Create Your Account</h2>

                {(oauthEnabled.google || oauthEnabled.github) && (
                  <div className="social-login">
                    <p className="social-or">or sign up with</p>
                    <div className="social-buttons-row">
                      {oauthEnabled.google && (
                        <button
                          type="button"
                          className="social-btn google"
                          onClick={handleGoogleLogin}
                          title="Sign up with Google"
                        >
                          <span className="social-icon" aria-hidden>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </span>
                          Google
                        </button>
                      )}
                      {oauthEnabled.github && (
                        <button
                          type="button"
                          className="social-btn github"
                          onClick={handleGithubLogin}
                          title="Sign up with GitHub"
                        >
                          <span className="social-icon" aria-hidden>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          </span>
                          GitHub
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <p className="social-or">
                  {(oauthEnabled.google || oauthEnabled.github) ? "or with email" : "Sign up with email"}
                </p>

                <div className="register-flow-progress" role="group" aria-label="Sign-up steps">
                  {[0, 1, 2].map((i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <div
                          className={`register-flow-progress-line ${step >= i ? "is-active" : ""}`}
                          aria-hidden
                        />
                      )}
                      <div
                        className={`register-flow-dot ${step === i ? "is-current" : ""} ${step > i ? "is-done" : ""}`}
                      >
                        <span className="register-flow-dot-num">{i + 1}</span>
                        <span className="register-flow-dot-label">{stepTitles[i]}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {notification.message && (
                  <div className={`notification ${notification.type}`}>{notification.message}</div>
                )}

                {step === STEP_EMAIL && (
                  <div className="register-flow-panel">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendOtp();
                      }}
                    >
                      <label>Email Address</label>
                      {emailAlreadyRegistered && (
                        <div className="register-exists-callout" role="alert">
                          <p className="register-exists-callout-title">This email is already present</p>
                          <p className="register-exists-callout-text">
                            An account already uses this address. Sign in or try a different email.
                          </p>
                        </div>
                      )}
                      <input
                        type="email"
                        autoComplete="email"
                        className={[
                          errors.email || emailAlreadyRegistered ? "input-error" : "",
                          emailAlreadyRegistered ? "input-error--exists" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        placeholder="name@example.com"
                        value={email}
                        onChange={(ev) => {
                          setEmail(ev.target.value);
                          setEmailAlreadyRegistered(false);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                      />
                      {errors.email && (
                        <p className="form-error form-error--friendly" role="alert">
                          <span className="form-error-icon" aria-hidden>!</span>
                          <span>{errors.email}</span>
                        </p>
                      )}
                      {errors.form && (
                        <p className="form-error form-error--friendly" role="alert">
                          <span className="form-error-icon" aria-hidden>!</span>
                          <span>{errors.form}</span>
                        </p>
                      )}
                      <button type="submit" className="register-flow-primary" disabled={sendingOtp}>
                        {sendingOtp ? "Checking & sending…" : "Continue"}
                      </button>
                    </form>
                  </div>
                )}

                {step === STEP_OTP && (
                  <div className="register-flow-panel register-flow-panel--otp">
                    <p className="register-flow-email-meta">
                      Enter the code we sent to <strong>{email.trim() || "your email"}</strong>
                    </p>
                    <label htmlFor="register-otp-input">Verification code</label>
                    <input
                      id="register-otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      className={["register-otp-input", errors.otp ? "input-error" : ""].filter(Boolean).join(" ")}
                      placeholder="000000"
                      value={otp}
                      onChange={(ev) => {
                        setOtp(ev.target.value.replace(/\s/g, ""));
                        if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
                      }}
                    />
                    {errors.otp && (
                      <p className="form-error form-error--friendly" role="alert">
                        <span className="form-error-icon" aria-hidden>!</span>
                        <span>{errors.otp}</span>
                      </p>
                    )}
                    {errors.form && (
                      <p className="form-error form-error--friendly" role="alert">
                        <span className="form-error-icon" aria-hidden>!</span>
                        <span>{errors.form}</span>
                      </p>
                    )}
                    <button
                      type="button"
                      className="register-flow-primary"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp}
                    >
                      {verifyingOtp ? "Verifying…" : "Verify & continue"}
                    </button>
                    <div className="register-flow-actions-row">
                      <button type="button" className="link-as-button" onClick={handleBackToEmail}>
                        Change email
                      </button>
                      <button
                        type="button"
                        className="link-as-button"
                        onClick={handleResendOtp}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? "Sending…" : "Resend code"}
                      </button>
                    </div>
                  </div>
                )}

                {step === STEP_DETAILS && (
                  <form className="register-flow-panel register-flow-panel--details" onSubmit={handleRegister}>
                    <p className="register-flow-email-meta">
                      Signing up as <strong>{email.trim()}</strong>
                    </p>

                    <label>Full Name</label>
                    <input
                      type="text"
                      autoComplete="name"
                      className={errors.name ? "input-error" : ""}
                      placeholder="Enter name"
                      value={name}
                      onChange={(ev) => {
                        setName(ev.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                    />
                    {errors.name && (
                      <p className="form-error form-error--friendly" role="alert">
                        <span className="form-error-icon" aria-hidden>!</span>
                        <span>{errors.name}</span>
                      </p>
                    )}

                    <label>Password</label>
                    <div className="password-field">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={errors.password ? "input-error" : ""}
                        placeholder="P@ss123!"
                        value={password}
                        onChange={(ev) => {
                          setPassword(ev.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                        }}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
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
                    {errors.password && (
                      <p className="form-error form-error--friendly" role="alert">
                        <span className="form-error-icon" aria-hidden>!</span>
                        <span>{errors.password}</span>
                      </p>
                    )}

                    <label>Confirm Password</label>
                    <div className="password-field">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={errors.confirmPassword ? "input-error" : ""}
                        placeholder="Re-type Password"
                        value={confirmPassword}
                        onChange={(ev) => {
                          setConfirmPassword(ev.target.value);
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }}
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
                    {errors.confirmPassword && (
                      <p className="form-error form-error--friendly" role="alert">
                        <span className="form-error-icon" aria-hidden>!</span>
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}

                    <div className="terms-section">
                      <label className="terms-checkbox">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(ev) => {
                            setAcceptedTerms(ev.target.checked);
                            if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                          }}
                        />
                        <span className="terms-label-text">
                          I agree to the{" "}
                          <span className="terms-links-inline">
                            <button type="button" className="link-as-button" onClick={() => setModal("terms")}>Terms &amp; Conditions</button>
                            {" "}and{" "}
                            <button type="button" className="link-as-button" onClick={() => setModal("privacy")}>Privacy Policy</button>
                          </span>
                          .
                        </span>
                      </label>
                      {errors.terms && (
                        <p className="form-error form-error--friendly" role="alert">
                          <span className="form-error-icon" aria-hidden>!</span>
                          <span>{errors.terms}</span>
                        </p>
                      )}
                    </div>

                    {errors.form && (
                      <p className="form-error form-error--friendly" role="alert">
                        <span className="form-error-icon" aria-hidden>!</span>
                        <span>{errors.form}</span>
                      </p>
                    )}

                    <button type="submit" className="register-flow-primary" disabled={submittingRegister}>
                      {submittingRegister ? "Creating account…" : "Sign Up"}
                    </button>
                  </form>
                )}

                <hr className="divider" />

                <p className="bottom-text">
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </div>
            </div>
          </div>

          {modal === "terms" && (
            <div className="modal-overlay" onClick={() => setModal(null)}>
              <div className="modal-box terms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Terms &amp; Conditions</h2>
                  <button type="button" className="modal-close-x" onClick={() => setModal(null)} aria-label="Close">×</button>
                </div>
                <div className="modal-content">
                  <p><strong>1. Acceptance</strong><br />These Terms &amp; Conditions govern your use of CarbonCalc (the &quot;Service&quot;), a carbon footprint tracking application. By registering or using the Service, you agree to these terms.</p>
                  <p><strong>2. Description of Service</strong><br />CarbonCalc allows you to create an account, log in (via email/password or Google/GitHub), track your carbon-related activities, and view a personal dashboard. The Service includes features such as forgot-password (OTP by email when configured) and optional OAuth sign-in.</p>
                  <p><strong>3. Account &amp; Security</strong><br />You are responsible for keeping your account credentials secure and for all activity under your account. You must provide accurate information when registering and keep your email and password confidential.</p>
                  <p><strong>4. Acceptable Use</strong><br />You agree to use the Service only for lawful purposes and in a way that does not infringe others&apos; rights or restrict their use. You may not misuse the Service, attempt to gain unauthorized access, or use it to harm the environment or others.</p>
                  <p><strong>5. Data &amp; Privacy</strong><br />Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described there.</p>
                  <p><strong>6. Changes</strong><br />We may update these terms from time to time. Continued use of the Service after changes are published constitutes acceptance of the updated terms. We encourage you to review this page periodically.</p>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-close" onClick={() => setModal(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {modal === "privacy" && (
            <div className="modal-overlay" onClick={() => setModal(null)}>
              <div className="modal-box terms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Privacy Policy</h2>
                  <button type="button" className="modal-close-x" onClick={() => setModal(null)} aria-label="Close">×</button>
                </div>
                <div className="modal-content">
                  <p><strong>1. Introduction</strong><br />This Privacy Policy describes how CarbonCalc (&quot;we&quot;, &quot;our&quot;) collects, uses, and protects your personal data when you use our carbon footprint tracking application.</p>
                  <p><strong>2. Data We Collect</strong><br />When you register, we collect your name, email address, and password (stored in encrypted form). If you sign in with Google or GitHub, we receive your profile information (e.g. name, email) as provided by those providers. When you use the Service, we may store carbon logs and other data you enter on your dashboard.</p>
                  <p><strong>3. How We Use Your Data</strong><br />We use your data to provide the Service (e.g. account management, login, password reset, OTP delivery when email is configured), to personalize your dashboard, and to improve the Service. We do not sell your personal data to third parties.</p>
                  <p><strong>4. Security</strong><br />We use industry-standard measures to protect your data, including secure storage and transmission. Passwords are hashed; OAuth tokens and session data are handled securely.</p>
                  <p><strong>5. Your Rights</strong><br />You may access, correct, or request deletion of your personal data by contacting us or through your account settings where available. You may withdraw consent where applicable, subject to legal or contractual limits.</p>
                  <p><strong>6. Updates</strong><br />We may update this Privacy Policy from time to time. We will notify users of material changes where appropriate. Continued use of the Service after updates constitutes acceptance of the revised policy.</p>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-close" onClick={() => setModal(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="auth-footer" style={{ textAlign: "center", padding: "1.5rem", color: "#666", fontSize: "0.875rem", marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} CarbonCalc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Register;
