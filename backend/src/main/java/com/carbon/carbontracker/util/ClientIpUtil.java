package com.carbon.carbontracker.util;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpUtil {

    private ClientIpUtil() {}

    /**
     * Resolves client IP: prefers public IP from frontend header, then proxy headers, then remote address.
     */
    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return "N/A";
        }
        String pub = firstNonBlank(
                request.getHeader("X-Public-IP"),
                request.getHeader("X-Client-IP"),
                request.getHeader("CF-Connecting-IP")
        );
        if (pub != null) {
            return pub;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String addr = request.getRemoteAddr();
        return (addr != null && !addr.isBlank()) ? addr : "N/A";
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
