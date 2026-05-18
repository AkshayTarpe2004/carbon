import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import API_BASE from "../config";
import { getStoredToken, hasValidSession, describeApiError } from "../utils/auth";
import "./LifestyleSurvey.css";

const TRANSPORT_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "bike", label: "Bike" },
  { value: "public", label: "Public Transport" },
  { value: "walk", label: "Walk" },
  { value: "wfh", label: "Work from home" },
];

const FUEL_OPTIONS = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
];

const DIET_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non-vegetarian", label: "Non-Vegetarian" },
];

const initialForm = {
  primaryMode: "",
  dailyDistanceKm: "",
  fuelType: "",
  dietType: "",
  mealsPerDay: "",
  monthlyElectricityKwh: "",
  renewableEnergy: false,
};

function LifestyleSurvey() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const showFuelType = form.primaryMode === "car";

  useEffect(() => {
    if (!hasValidSession()) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (form.primaryMode !== "car") {
      setForm((p) => ({ ...p, fuelType: "" }));
    }
  }, [form.primaryMode]);

  const noTravel = form.primaryMode === "wfh";

  const validate = () => {
    const next = {};
    if (!form.primaryMode.trim()) next.primaryMode = "Please choose how you usually travel.";
    const dist = parseFloat(form.dailyDistanceKm, 10);
    if (noTravel) {
      if (form.dailyDistanceKm !== "" && !isNaN(dist) && dist < 0) {
        next.dailyDistanceKm = "Enter 0 or leave empty if you don't travel.";
      }
    } else {
      if (form.dailyDistanceKm === "" || isNaN(dist) || dist < 0) {
        next.dailyDistanceKm = "Enter distance in km (0 or more).";
      }
    }
    if (showFuelType && !form.fuelType.trim()) next.fuelType = "Please select a fuel type for your car.";
    if (!form.dietType.trim()) next.dietType = "Please select a diet type.";
    const meals = parseInt(form.mealsPerDay, 10);
    if (form.mealsPerDay === "" || isNaN(meals) || meals < 1 || meals > 10) {
      next.mealsPerDay = "Enter between 1 and 10 (typical meals per day).";
    }
    const kwh = parseFloat(form.monthlyElectricityKwh, 10);
    if (form.monthlyElectricityKwh === "" || isNaN(kwh) || kwh < 0) {
      next.monthlyElectricityKwh = "Enter your monthly usage in kWh (0 if off-grid or unknown).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const monthlyKwh = parseFloat(form.monthlyElectricityKwh || 0);
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyEquivalentKwh = Number.isNaN(monthlyKwh) ? 0 : monthlyKwh / daysInCurrentMonth;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    if (!hasValidSession()) {
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      await axios.post(`${API_BASE}/survey`, {
        transportMode: form.primaryMode.toUpperCase(),
        distancePerDay: parseFloat(form.dailyDistanceKm || 0),
        fuelType: form.fuelType ? form.fuelType.toUpperCase() : null,
        dietType: form.dietType === "vegetarian" ? "VEG" : "NON_VEG",
        mealsPerDay: parseInt(form.mealsPerDay, 10),
        monthlyElectricity: dailyEquivalentKwh,
        renewable: form.renewableEnergy,
      });

      try {
        window.dispatchEvent(new Event("carboncalc-footprint-updated"));
      } catch {
        /* ignore */
      }

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setErrors({
          submit: "Session expired or invalid. Please log out and sign in again.",
        });
      } else {
        setErrors({
          submit: describeApiError(
            err,
            "Something went wrong. Check your connection and try again."
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/dashboard");

  if (success) {
    return (
      <AppLayout>
        <div className="survey-page">
          <div className="survey-success card">
            <span className="survey-success-icon">✓</span>
            <h2 className="survey-success-title">Footprint calculated</h2>
            <p className="survey-success-text">Your carbon footprint has been saved. Redirecting to dashboard…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="survey-page">
        <div className="survey-breadcrumb">Set up your carbon profile</div>
        <h1 className="survey-title">Lifestyle Survey</h1>
        <p className="survey-desc">
          Tell us about your usual habits. Rough estimates are fine — you can change answers anytime from your dashboard.
        </p>


        <form className="survey-form card" onSubmit={handleSubmit} aria-label="Lifestyle and carbon footprint survey">
          <div className="survey-sections-cols">
          {/* Transport */}
          <section className="survey-section" aria-labelledby="survey-section-transport-title">
            <div className="survey-section-header survey-section-transport">
              <span className="survey-section-icon" aria-hidden>🚗</span>
              <div>
                <h2 id="survey-section-transport-title" className="survey-section-title">Transport</h2>
                <p className="survey-section-desc">How you usually travel on a typical day.</p>
              </div>
            </div>
            <div className="survey-fields">
              <label className="survey-label">
                <span className="survey-label-text">
                  Primary transport mode <span className="survey-required" aria-hidden="true">*</span>
                </span>
                <select
                  name="primaryMode"
                  value={form.primaryMode}
                  onChange={handleChange}
                  className="survey-input survey-select"
                  aria-invalid={!!errors.primaryMode}
                  aria-required="true"
                >
                  <option value="">Select mode...</option>
                  {TRANSPORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.primaryMode && <span className="survey-error">{errors.primaryMode}</span>}
              </label>
              <label className="survey-label">
                <span className="survey-label-text">
                  Average distance per day (km)
                  {noTravel ? (
                    <span className="survey-label-optional"> — optional if you don’t commute</span>
                  ) : (
                    <span className="survey-required" aria-hidden="true"> *</span>
                  )}
                </span>
                <input
                  type="number"
                  name="dailyDistanceKm"
                  value={form.dailyDistanceKm}
                  onChange={handleChange}
                  placeholder={noTravel ? "0 or leave empty" : "e.g. 10"}
                  className="survey-input"
                  min="0"
                  step="0.1"
                  aria-invalid={!!errors.dailyDistanceKm}
                  aria-required={!noTravel}
                />
                {errors.dailyDistanceKm && <span className="survey-error">{errors.dailyDistanceKm}</span>}
              </label>
              {showFuelType && (
                <label className="survey-label">
                  <span className="survey-label-text">
                    Fuel type <span className="survey-required" aria-hidden="true">*</span>
                  </span>
                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                    className="survey-input survey-select"
                    aria-invalid={!!errors.fuelType}
                    aria-required="true"
                  >
                    <option value="">Select fuel type...</option>
                    {FUEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.fuelType && <span className="survey-error">{errors.fuelType}</span>}
                </label>
              )}
            </div>
          </section>

          {/* Food */}
          <section className="survey-section" aria-labelledby="survey-section-food-title">
            <div className="survey-section-header survey-section-food">
              <span className="survey-section-icon" aria-hidden>🍽</span>
              <div>
                <h2 id="survey-section-food-title" className="survey-section-title">Food & diet</h2>
                <p className="survey-section-desc">Typical eating pattern — not a perfect diet audit.</p>
              </div>
            </div>
            <div className="survey-fields">
              <label className="survey-label">
                <span className="survey-label-text">
                  Diet type <span className="survey-required" aria-hidden="true">*</span>
                </span>
                <select
                  name="dietType"
                  value={form.dietType}
                  onChange={handleChange}
                  className="survey-input survey-select"
                  aria-invalid={!!errors.dietType}
                  aria-required="true"
                >
                  <option value="">Select diet...</option>
                  {DIET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.dietType && <span className="survey-error">{errors.dietType}</span>}
              </label>
              <label className="survey-label">
                <span className="survey-label-text">
                  Meals per day <span className="survey-required" aria-hidden="true">*</span>
                </span>
                <input
                  type="number"
                  name="mealsPerDay"
                  value={form.mealsPerDay}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  min="1"
                  max="10"
                  className="survey-input"
                  aria-invalid={!!errors.mealsPerDay}
                  aria-required="true"
                  aria-describedby="hint-meals"
                />
                {errors.mealsPerDay && <span className="survey-error">{errors.mealsPerDay}</span>}
              </label>
            </div>
          </section>

          {/* Energy */}
          <section className="survey-section" aria-labelledby="survey-section-energy-title">
            <div className="survey-section-header survey-section-energy">
              <span className="survey-section-icon" aria-hidden>⚡</span>
              <div>
                <h2 id="survey-section-energy-title" className="survey-section-title">Home energy</h2>
                <p className="survey-section-desc">Electricity for your home.</p>
              </div>
            </div>
            <div className="survey-fields">
              <label className="survey-label">
                <span className="survey-label-text">
                  Monthly electricity <span className="survey-unit-inline">(kWh)</span>{" "}
                  <span className="survey-required" aria-hidden="true">*</span>
                </span>
                <input
                  type="number"
                  name="monthlyElectricityKwh"
                  value={form.monthlyElectricityKwh}
                  onChange={handleChange}
                  placeholder="e.g. 240"
                  className="survey-input"
                  min="0"
                  step="1"
                  aria-invalid={!!errors.monthlyElectricityKwh}
                  aria-required="true"
                  aria-describedby="hint-kwh"
                />
                <span id="hint-kwh" className="survey-hint">
                  Find “kWh” on your power bill, or estimate.
                </span>
                {errors.monthlyElectricityKwh && <span className="survey-error">{errors.monthlyElectricityKwh}</span>}
              </label>
              <label className="survey-label survey-toggle-wrap">
                <div className="survey-toggle-copy">
                  <span className="survey-toggle-label">Renewable or green energy plan</span>
                  <span className="survey-toggle-desc">Solar, wind, or utility green tariff</span>
                </div>
                <div className="survey-toggle-controls">
                  <span className={`survey-toggle-state ${form.renewableEnergy ? "is-on" : ""}`} aria-live="polite">
                    {form.renewableEnergy ? "On" : "Off"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.renewableEnergy}
                    aria-label={form.renewableEnergy ? "Renewable energy: on. Press to turn off." : "Renewable energy: off. Press to turn on."}
                    className={`survey-toggle ${form.renewableEnergy ? "on" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, renewableEnergy: !p.renewableEnergy }))}
                  >
                    <span className="survey-toggle-thumb" />
                  </button>
                </div>
              </label>
            </div>
          </section>
          </div>

          {errors.submit && <div className="survey-error survey-error-block" role="alert">{errors.submit}</div>}

          <div className="survey-actions">
            <p className="survey-actions-hint">
              When you’re ready, we’ll estimate your footprint and save it to your profile.
            </p>
            <div className="survey-actions-buttons">
            <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="survey-spinner" aria-hidden /> Calculating…
                </>
              ) : (
                <>Calculate footprint</>
              )}
            </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default LifestyleSurvey;
