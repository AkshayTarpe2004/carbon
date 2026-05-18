import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./MarketingHeader.css";

function MarketingHeader() {
  const { pathname } = useLocation();

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link to="/" className="landing-logo" aria-label="CarbonCalc home">
          <span className="landing-logo-icon" aria-hidden>
            🌿
          </span>
          <span className="landing-logo-text">CarbonCalc</span>
        </Link>
        <nav className="landing-nav" aria-label="Primary">
          {pathname === "/" ? (
            <span className="landing-nav-link landing-nav-link--current" aria-current="page">
              Home
            </span>
          ) : (
            <Link to="/" className="landing-nav-link">
              Home
            </Link>
          )}
          {pathname === "/about" ? (
            <span className="landing-nav-link landing-nav-link--current" aria-current="page">
              About
            </span>
          ) : (
            <Link to="/about" className="landing-nav-link">
              About
            </Link>
          )}
          {pathname === "/contact" ? (
            <span className="landing-nav-link landing-nav-link--current" aria-current="page">
              Contact
            </span>
          ) : (
            <Link to="/contact" className="landing-nav-link">
              Contact
            </Link>
          )}
          {pathname === "/login" ? (
            <span className="landing-nav-link landing-nav-link--current" aria-current="page">
              Login
            </span>
          ) : (
            <Link to="/login" className="landing-nav-link">
              Login
            </Link>
          )}
          {pathname === "/register" ? (
            <span
              className="btn btn-primary landing-nav-cta landing-nav-cta--current"
              aria-current="page"
            >
              Sign Up
            </span>
          ) : (
            <Link to="/register" className="btn btn-primary landing-nav-cta">
              Sign Up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default MarketingHeader;
