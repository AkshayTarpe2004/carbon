package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.AdminSettingsStoreService;
import com.carbon.carbontracker.util.ClientIpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AdminAuditLogService adminAuditLogService;
    private final AdminSettingsStoreService settingsStoreService;

    private String getCurrentActor() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmailNormalized(email).orElse(null);
            if (user == null) {
                return email;
            }
            return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();
        } catch (Exception ex) {
            return "System";
        }
    }

    // --- Settings Management ---

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(settingsStoreService.getSettingsWithDefaults());
    }

    @PutMapping("/settings")
    public ResponseEntity<String> updateSettings(@RequestBody Map<String, Object> settings,
                                                 HttpServletRequest request) {
        settingsStoreService.mergeSettings(settings);
        settingsStoreService.getSettingsWithDefaults().put("lastUpdatedBy", getCurrentActor());
        settingsStoreService.getSettingsWithDefaults().put("lastUpdatedAt", java.time.LocalDateTime.now().toString());
        settingsStoreService.getSettingsWithDefaults().put("lastUpdatedIp", ClientIpUtil.resolve(request));
        adminAuditLogService.log(
                "Settings Updated",
                settings != null ? settings.toString() : "",
                request);
        return ResponseEntity.ok("Settings updated successfully");
    }

    // --- Carbon Logs Data ---

    @GetMapping("/carbon-logs")
    public ResponseEntity<?> getAllCarbonLogs() {
        // return carbonLogRepository.findAll() or a paginated version
        return ResponseEntity.ok("Carbon logs endpoint - connect to your existing CarbonLog entity");
    }

    @GetMapping("/carbon-logs/user/{userId}")
    public ResponseEntity<?> getCarbonLogsByUser(@PathVariable Long userId) {
        // return carbonLogRepository.findByUserId(userId);
        return ResponseEntity.ok("Carbon logs for user " + userId);
    }
}