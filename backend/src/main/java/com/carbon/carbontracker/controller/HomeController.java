package com.carbon.carbontracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
                "message", "CarbonTracker API is running.",
                "frontend", "Open http://localhost:3000 in your browser to use the app.",
                "login", "No API key required. Use the frontend to sign in or register."
        );
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
