import React from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import { HOME_FEATURES } from "../data/marketingContent";
import "./Landing.css";
import "./MarketingPages.css";

function Landing() {
  return (
    <div className="landing">
      <MarketingHeader />

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-inner">
            <p className="landing-eyebrow">Environmentally conscious tracking</p>
            <h1 id="landing-hero-title" className="landing-hero-title">
              Understand your footprint
              <span className="landing-hero-title-accent"> Act on what matters</span>
            </h1>
            <p className="landing-hero-lead">
              CarbonCalc helps you measure daily emissions, set reduction goals, and track progress so
              small changes add up to real impact.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="btn btn-primary landing-hero-btn-primary">
                Create free account
              </Link>
              <Link to="/login" className="btn btn-secondary landing-hero-btn-secondary">
                I already have an account
              </Link>
            </div>
            <ul className="landing-hero-points" aria-label="Highlights">
              <li>Personal dashboard &amp; trends</li>
              <li>Lifestyle survey &amp; carbon history</li>
              <li>Goals, badges &amp; leaderboard</li>
            </ul>
          </div>
          <div className="landing-hero-art-wrap" aria-hidden>
            <div className="landing-hero-art">
              <div className="landing-hero-art-blob landing-hero-art-blob--1" />
              <div className="landing-hero-art-blob landing-hero-art-blob--2" />
              <div className="landing-hero-art-blob landing-hero-art-blob--3" />
              <div className="landing-hero-art-ring" />
              <svg
                className="landing-hero-art-svg"
                viewBox="0 0 320 280"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="landingGlobeRadial" cx="38%" cy="32%" r="72%">
                    <stop offset="0%" stopColor="#bbf7d0" />
                    <stop offset="45%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#14532d" />
                  </radialGradient>
                  <linearGradient id="landingGlobeShine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                    <stop offset="40%" stopColor="#ffffff" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="landingLeaf" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                  <filter id="landingSoft" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
                  </filter>
                  <filter id="landingGlowDot" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Scene centered at globe core (160, 128) */}
                <g className="landing-svg-scene">
                  {/* Outer slow counter-rotating ring */}
                  <g transform="translate(160 128)">
                    <g className="landing-svg-ring-reverse">
                      <circle
                        r="118"
                        fill="none"
                        stroke="rgba(21, 128, 61, 0.18)"
                        strokeWidth="1"
                        strokeDasharray="3 12"
                      />
                    </g>
                  </g>

                  {/* Orbit + glowing nodes */}
                  <g transform="translate(160 128)">
                    <g className="landing-svg-orbit">
                      <circle
                        r="104"
                        fill="none"
                        stroke="rgba(34, 197, 94, 0.35)"
                        strokeWidth="1.2"
                        strokeDasharray="6 14"
                      />
                      <circle
                        cx="0"
                        cy="-104"
                        r="5"
                        fill="#22c55e"
                        filter="url(#landingGlowDot)"
                        className="landing-svg-node"
                      />
                      <circle
                        cx="90"
                        cy="52"
                        r="4"
                        fill="#4ade80"
                        filter="url(#landingGlowDot)"
                        className="landing-svg-node landing-svg-node--b"
                      />
                      <circle
                        cx="-90"
                        cy="52"
                        r="4"
                        fill="#86efac"
                        filter="url(#landingGlowDot)"
                        className="landing-svg-node landing-svg-node--c"
                      />
                    </g>
                  </g>

                  {/* Planet + ground shadow */}
                  <g className="landing-svg-globe">
                    <circle cx="160" cy="128" r="86" fill="url(#landingGlobeRadial)" />
                    <circle cx="160" cy="128" r="86" fill="url(#landingGlobeShine)" />
                    <path
                      d="M92 168c18-42 52-68 88-72 36 4 70 30 88 72-22 38-58 62-88 62-30 0-66-24-88-62z"
                      fill="#052e16"
                      opacity="0.18"
                    />
                  </g>

                  {/* Leaves — sway as one group */}
                  <g className="landing-svg-leaves">
                    <path
                      d="M160 48c-8 28-4 52 12 72 10 14 24 22 38 26-6-32 2-58 18-78-22 6-46 4-68-20z"
                      fill="url(#landingLeaf)"
                      filter="url(#landingSoft)"
                    />
                    <path
                      d="M168 52c24 18 38 44 40 74-14-8-28-22-36-42-8-22-6-44-4-32z"
                      fill="#4ade80"
                      opacity="0.9"
                    />
                    <path
                      d="M152 56c-22 14-36 36-40 62 12-6 26-10 40-10 2-18 2-36 0-52z"
                      fill="#dcfce7"
                      opacity="0.95"
                    />
                  </g>

                  <ellipse
                    className="landing-svg-shadow"
                    cx="160"
                    cy="200"
                    rx="76"
                    ry="11"
                    fill="#15803d"
                    opacity="0.14"
                  />

                  <g className="landing-svg-sparkles" fill="#fff">
                    <g transform="translate(48 72)">
                      <circle r="2" className="landing-svg-spark landing-svg-spark--1" />
                    </g>
                    <g transform="translate(268 96)">
                      <circle r="1.5" className="landing-svg-spark landing-svg-spark--2" />
                    </g>
                    <g transform="translate(220 40)">
                      <circle r="1.5" className="landing-svg-spark landing-svg-spark--3" />
                    </g>
                    <g transform="translate(92 210)">
                      <circle r="1.5" className="landing-svg-spark landing-svg-spark--4" />
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section mp-home-features">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">Everything you need to track impact</h2>
            <p className="landing-section-sub">
              Built for clarity—see where your emissions come from and what to improve next.
            </p>
            <div className="mp-feature-grid">
              {HOME_FEATURES.map((f) => (
                <article key={f.title} className="mp-feature-card">
                  <div className="mp-feature-card-inner">
                    <div className="mp-feature-icon-wrap" aria-hidden>
                      {f.icon}
                    </div>
                    <h3 className="mp-feature-card-title">{f.title}</h3>
                    <p className="mp-feature-card-text">{f.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="landing-section landing-how">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">How it works</h2>
            <p className="landing-section-sub">Three steps to a clearer footprint.</p>
            <ol className="landing-steps">
              <li className="landing-step">
                <span className="landing-step-num">1</span>
                <div>
                  <h3 className="landing-step-title">Sign up &amp; sign in</h3>
                  <p className="landing-step-text">
                    Create an account with email or sign in with Google or GitHub—your data stays
                    yours.
                  </p>
                </div>
              </li>
              <li className="landing-step">
                <span className="landing-step-num">2</span>
                <div>
                  <h3 className="landing-step-title">Complete your survey</h3>
                  <p className="landing-step-text">
                    Tell us about your habits—we turn that into an estimate you can refine over time.
                  </p>
                </div>
              </li>
              <li className="landing-step">
                <span className="landing-step-num">3</span>
                <div>
                  <h3 className="landing-step-title">Track, goal, improve</h3>
                  <p className="landing-step-text">
                    Review history, set goals, explore the marketplace, and watch your impact shift.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}

export default Landing;
