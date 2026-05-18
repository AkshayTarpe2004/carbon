import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LifestyleSurvey from "./pages/LifestyleSurvey";
import CarbonHistory from "./pages/CarbonHistory";
import CarbonLogDetails from "./pages/CarbonLogDetails";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import OAuth2RedirectHandler from "./pages/OAuth2RedirectHandler";
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import Goals from "./pages/Goals";
import AdminDashboard from "./pages/AdminDashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import Marketplace from "./pages/Marketplace";
import Notifications from "./pages/Notifications";
import Transactions from "./pages/Transactions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/survey" element={<LifestyleSurvey />} />
        <Route path="/lifestyle-survey" element={<Navigate to="/survey" replace />} />
        <Route path="/carbon-history" element={<CarbonHistory />} />
        <Route path="/carbon-details/:id" element={<CarbonLogDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
        <Route path="/admindashboard" element={<Navigate to="/AdminDashboard" replace />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/Goals" element={<Goals />} />
        <Route path="/AdminDashboard" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
  );
}

export default App;
