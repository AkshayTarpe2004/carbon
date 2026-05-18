import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import "./Landing.css";
import "./MarketingPages.css";

function About() {
  return (
    <div className="landing mp-subpage">
      <MarketingHeader />
      <main className="mp-main">
        <section className="mp-hero" aria-labelledby="about-page-title">
          <div className="mp-hero-inner">
            <p className="mp-hero-eyebrow">Our story</p>
            <h1 id="about-page-title" className="mp-hero-title">
              Carbon Clarity
              <span className="mp-hero-title-accent"> for real life.</span>
            </h1>
            <p className="mp-hero-lead">
              We built CarbonCalc to make personal carbon tracking simple, honest, and actionable whether
              you are just starting out or refining a long-term sustainability habit.
            </p>
          </div>
        </section>

        <section className="landing-section landing-about-page mp-about-body">
          <div className="landing-section-inner">

            <div className="mp-about-grid">
              <div className="mp-about-tile">
                <span className="mp-about-tile-icon" aria-hidden>
                  🎯
                </span>
                <h3 className="mp-about-tile-title">Our mission</h3>
                <p className="mp-about-tile-text">
                  Empower everyone to understand their environmental impact with clear data and practical steps to reduce it over time.
                </p>
              </div>
              <div className="mp-about-tile">
                <span className="mp-about-tile-icon" aria-hidden>
                  🤝
                </span>
                <h3 className="mp-about-tile-title">What we believe</h3>
                <p className="mp-about-tile-text">
                  Small, consistent changes matter. Transparency builds trust. Your data is yours; we
                  focus on helping you learn and improve, not on selling your information.
                </p>
              </div>
              <div className="mp-about-tile">
                <span className="mp-about-tile-icon" aria-hidden>
                  🌱
                </span>
                <h3 className="mp-about-tile-title">Where we are headed</h3>
                <p className="mp-about-tile-text">
                  We are continuously improving estimates, categories, and insights so CarbonCalc stays
                  useful as your habits.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

export default About;
