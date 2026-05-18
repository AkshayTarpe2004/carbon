package com.carbon.carbontracker.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminSettingsStoreService {

    private final Map<String, Object> settingsStore = new ConcurrentHashMap<>();

    public synchronized Map<String, Object> getSettingsWithDefaults() {
        ensureDefaults();
        return settingsStore;
    }

    public synchronized void mergeSettings(Map<String, Object> incoming) {
        ensureDefaults();
        if (incoming != null) {
            settingsStore.putAll(incoming);
        }
    }

    public double getDouble(String key, double fallback) {
        Object value = getSettingsWithDefaults().get(key);
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        if (value instanceof String s) {
            try {
                return Double.parseDouble(s);
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    public boolean getBoolean(String key, boolean fallback) {
        Object value = getSettingsWithDefaults().get(key);
        if (value instanceof Boolean b) {
            return b;
        }
        if (value instanceof String s) {
            String normalized = s.trim().toLowerCase();
            if ("true".equals(normalized) || "1".equals(normalized) || "yes".equals(normalized)) {
                return true;
            }
            if ("false".equals(normalized) || "0".equals(normalized) || "no".equals(normalized)) {
                return false;
            }
        }
        if (value instanceof Number n) {
            return n.intValue() != 0;
        }
        return fallback;
    }

    public String getString(String key, String fallback) {
        Object value = getSettingsWithDefaults().get(key);
        if (value == null) return fallback;
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? fallback : s;
    }

    private void ensureDefaults() {
        settingsStore.putIfAbsent("emissionThreshold", 15.0);
        settingsStore.putIfAbsent("appVersion", "4.0.0");
        settingsStore.putIfAbsent("appName", "CarbonCalc");
        settingsStore.putIfAbsent("logoDataUrl", "");
        settingsStore.putIfAbsent("electricityFactor", 0.82);
        settingsStore.putIfAbsent("carPetrolFactor", 0.21);
        settingsStore.putIfAbsent("carDieselFactor", 0.18);
        settingsStore.putIfAbsent("carElectricFactor", 0.05);
        settingsStore.putIfAbsent("transportFactor", 0.12);
        settingsStore.putIfAbsent("bikeFactor", 0.024);
        settingsStore.putIfAbsent("foodVegFactor", 1.5);
        settingsStore.putIfAbsent("foodNonVegFactor", 3.3);
        settingsStore.putIfAbsent("maintenanceMode", false);
        settingsStore.putIfAbsent("maintenanceStart", "");
        settingsStore.putIfAbsent("maintenanceEnd", "");
    }
}

