import React, { useState } from "react";
import axios from "axios";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import API_BASE from "../config";
import "./Landing.css";
import "./MarketingPages.css";
import "./Contact.css";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status.text) setStatus({ type: "", text: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus({ type: "error", text: "Please fill in name, email, subject, and message." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "", text: "" });
    try {
      await axios.post(`${API_BASE}/contact/messages`, {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus({
        type: "success",
        text: "Message sent successfully! We will get back to you soon.",
      });
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Could not send your message. Please try again later.";
      setStatus({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing mp-subpage contact-page">
      <MarketingHeader />
      <main className="mp-main">
        <section className="mp-hero" aria-labelledby="contact-page-title">
          <div className="mp-hero-inner">
            <p className="mp-hero-eyebrow">Get in touch</p>
            <h1 id="contact-page-title" className="mp-hero-title">
              We are here
              <span className="mp-hero-title-accent"> to help.</span>
            </h1>
          </div>
        </section>

        <section className="landing-section mp-contact-body" aria-label="Contact options">
          <div className="landing-section-inner">
            <div className="mp-contact-layout">
              <aside className="mp-contact-aside mp-contact-visual" aria-label="Contact illustration">
                <div className="mp-contact-art-wrap" aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 320 320" className="contact-svg-art">
                    <defs>
                      <linearGradient id="envelopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#86efac" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f0fdf4" />
                        <stop offset="100%" stopColor="#dcfce7" />
                      </linearGradient>
                    </defs>
                    <g className="contact-svg-clouds">
                      <path d="M 40 220 Q 55 190 85 195 Q 115 170 145 200 Q 160 190 190 220 Z" fill="url(#cloudGrad)" opacity="0.8" />
                      <path d="M 160 120 Q 190 90 235 95 Q 265 70 295 100 Q 310 90 325 120 Z" fill="url(#cloudGrad)" opacity="0.6" />
                    </g>
                    <g className="contact-svg-envelope">
                      <rect x="70" y="110" width="180" height="120" rx="12" fill="url(#envelopeGrad)" />
                      <path d="M 70 110 L 160 180 L 250 110" stroke="#f0fdf4" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
                      <path d="M 70 230 L 140 160 M 250 230 L 180 160" stroke="#f0fdf4" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <g className="contact-svg-paperplane">
                      <path d="M 155 145 L 265 65 L 195 175 L 170 145 Z" fill="#ffffff" />
                      <path d="M 155 145 L 265 65 L 175 145" stroke="#166534" strokeWidth="1" strokeOpacity="0.15" fill="none" />
                      <path d="M 175 145 L 170 175 L 195 175" fill="#dcfce7" />
                    </g>
                    <g className="contact-svg-leaves">
                      <path d="M 40 100 C 20 80 30 40 60 30 C 60 60 70 80 40 100 Z" fill="#4ade80" opacity="0.7" />
                      <path d="M 280 240 C 300 260 290 300 260 310 C 260 280 250 260 280 240 Z" fill="#22c55e" opacity="0.8" />
                      <path d="M 70 280 C 50 290 40 320 60 340 C 70 320 90 300 70 280 Z" fill="#bbf7d0" opacity="0.6" />
                    </g>
                  </svg>
                </div>
              </aside>

              <form className="mp-contact-form" onSubmit={handleSubmit} noValidate>
                <h2 className="mp-contact-form-heading">Send a message</h2>
                <div className="mp-form-fields-row">
                  <div className="mp-form-row">
                    <label className="mp-form-label" htmlFor="contact-name">
                      Name <span className="mp-form-required">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      className="mp-form-input"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="mp-form-row">
                    <label className="mp-form-label" htmlFor="contact-email">
                      Email <span className="mp-form-required">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="mp-form-input"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="mp-form-row">
                  <label className="mp-form-label" htmlFor="contact-subject">
                    Subject <span className="mp-form-required">*</span>
                  </label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    className="mp-form-input"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                  />
                </div>
                <div className="mp-form-row">
                  <label className="mp-form-label" htmlFor="contact-message">
                    Message <span className="mp-form-required">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="mp-form-textarea"
                    rows={5}
                    required
                    value={form.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                  />
                </div>
                {status.text && (
                  <p
                    className={
                      status.type === "error" ? "mp-form-feedback mp-form-feedback--error" : "mp-form-feedback mp-form-feedback--success"
                    }
                    role={status.type === "error" ? "alert" : "status"}
                  >
                    {status.text}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn-primary mp-form-submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

export default Contact;
