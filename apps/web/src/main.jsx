import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./app.css";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Catalog AI POC render error", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "32px", fontFamily: "sans-serif", color: "#22323f" }}>
          <h1 style={{ marginTop: 0 }}>App failed to load</h1>
          <p>{this.state.error.message || "Unknown render error"}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
