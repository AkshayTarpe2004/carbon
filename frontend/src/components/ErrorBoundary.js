import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#64748b", maxWidth: 420, marginBottom: 16 }}>
            The page crashed while loading. Try refreshing, or sign in again.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/login")}
            style={{
              padding: "10px 20px",
              background: "#15803d",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Go to login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
