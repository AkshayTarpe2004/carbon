import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="auth-wrapper">
      <div className="auth-box terms-page">
        <div className="terms-page-header">
          <h2>Privacy Policy</h2>
          <button type="button" className="modal-close-x" onClick={() => navigate("/register")} aria-label="Close">×</button>
        </div>
        <div className="terms-page-body">
          <p><strong>1. Introduction</strong><br />This Privacy Policy describes how CarbonCalc (&quot;we&quot;, &quot;our&quot;) collects, uses, and protects your personal data when you use our carbon footprint tracking application.</p>
          <p><strong>2. Data We Collect</strong><br />When you register, we collect your name, email address, and password (stored in encrypted form). If you sign in with Google or GitHub, we receive your profile information (e.g. name, email) as provided by those providers. When you use the Service, we may store carbon logs and other data you enter on your dashboard.</p>
          <p><strong>3. How We Use Your Data</strong><br />We use your data to provide the Service (e.g. account management, login, password reset, OTP delivery when email is configured), to personalize your dashboard, and to improve the Service. We do not sell your personal data to third parties.</p>
          <p><strong>4. Security</strong><br />We use industry-standard measures to protect your data, including secure storage and transmission. Passwords are hashed; OAuth tokens and session data are handled securely.</p>
          <p><strong>5. Your Rights</strong><br />You may access, correct, or request deletion of your personal data by contacting us or through your account settings where available. You may withdraw consent where applicable, subject to legal or contractual limits.</p>
          <p><strong>6. Updates</strong><br />We may update this Privacy Policy from time to time. We will notify users of material changes where appropriate. Continued use of the Service after updates constitutes acceptance of the revised policy.</p>
        </div>
        <div className="terms-page-actions">
          <button type="button" className="btn-close" onClick={() => navigate("/register")}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Privacy;

