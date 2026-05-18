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
import ProtectedRoute from "./components/ProtectedRoute";
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
        <Route path="/dashboard" element={<ProtectedRoute requireUser><Dashboard /></ProtectedRoute>} />
        <Route path="/survey" element={<ProtectedRoute requireUser><LifestyleSurvey /></ProtectedRoute>} />
        <Route path="/lifestyle-survey" element={<Navigate to="/survey" replace />} />
        <Route path="/carbon-history" element={<ProtectedRoute requireUser><CarbonHistory /></ProtectedRoute>} />
        <Route path="/carbon-details/:id" element={<ProtectedRoute requireUser><CarbonLogDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/badges" element={<ProtectedRoute requireUser><Badges /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute requireUser><Leaderboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><ErrorBoundary><AdminDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admindashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/goals" element={<ProtectedRoute requireUser><Goals /></ProtectedRoute>} />
        <Route path="/Goals" element={<ProtectedRoute requireUser><Goals /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute requireUser><Marketplace /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute requireUser><Transactions /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute requireUser><Notifications /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
