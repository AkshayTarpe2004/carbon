import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Terms() {
  const navigate = useNavigate();
  return (
    <div className="auth-wrapper">
      <div className="auth-box terms-page">
        <div className="terms-page-header">
          <h2>Terms &amp; Conditions</h2>
          <button type="button" className="modal-close-x" onClick={() => navigate("/register")} aria-label="Close">×</button>
        </div>
        <div className="terms-page-body">
          <p><strong>1. Acceptance</strong><br />These Terms &amp; Conditions govern your use of CarbonCalc (the &quot;Service&quot;), a carbon footprint tracking application. By registering or using the Service, you agree to these terms.</p>
          <p><strong>2. Description of Service</strong><br />CarbonCalc allows you to create an account, log in (via email/password or Google/GitHub), track your carbon-related activities, and view a personal dashboard. The Service includes features such as forgot-password (OTP by email when configured) and optional OAuth sign-in.</p>
          <p><strong>3. Account &amp; Security</strong><br />You are responsible for keeping your account credentials secure and for all activity under your account. You must provide accurate information when registering and keep your email and password confidential.</p>
          <p><strong>4. Acceptable Use</strong><br />You agree to use the Service only for lawful purposes and in a way that does not infringe others&apos; rights or restrict their use. You may not misuse the Service, attempt to gain unauthorized access, or use it to harm the environment or others.</p>
          <p><strong>5. Data &amp; Privacy</strong><br />Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described there.</p>
          <p><strong>6. Changes</strong><br />We may update these terms from time to time. Continued use of the Service after changes are published constitutes acceptance of the updated terms. We encourage you to review this page periodically.</p>
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

export default Terms;

