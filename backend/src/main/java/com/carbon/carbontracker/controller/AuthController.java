package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.RegisterRequest;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.AdminSettingsStoreService;
import com.carbon.carbontracker.service.UserService;
import com.carbon.carbontracker.util.PasswordValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.carbon.carbontracker.config.JwtUtil;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Value("${spring.security.oauth2.client.registration.google.client-id:optional}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.github.client-id:optional}")
    private String githubClientId;

    private static boolean isOAuthConfigured(String clientId) {
        return clientId != null && !clientId.isBlank() && !"optional".equals(clientId.trim());
    }

    @GetMapping("/oauth-enabled")
    public ResponseEntity<Map<String, Boolean>> oauthEnabled() {
        return ResponseEntity.ok(Map.of(
                "google", isOAuthConfigured(googleClientId),
                "github", isOAuthConfigured(githubClientId)
        ));
    }

    @PostMapping("/register/send-otp")
    public ResponseEntity<?> registerSendOtp(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        UserService.RegistrationOtpSendOutcome outcome = userService.requestRegistrationOtp(email);
        if (!outcome.success()) {
            return ResponseEntity.badRequest().body(Map.of("message", outcome.message()));
        }
        return ResponseEntity.ok(Map.of("message", outcome.message()));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<?> registerVerifyOtp(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String otp = body != null ? body.get("otp") : null;
        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and verification code are required."));
        }
        UserService.RegistrationOtpVerifyOutcome verifyOutcome =
                userService.verifyRegistrationOtp(email.trim(), otp.trim());
        if (!verifyOutcome.success()) {
            return ResponseEntity.badRequest().body(Map.of("message", verifyOutcome.message()));
        }
        return ResponseEntity.ok(Map.of("message", "Email verified. You can finish creating your account."));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        String response = userService.registerUser(request);

        if (response.startsWith("This email is already present")) {
            return ResponseEntity.badRequest().body(response);
        }
        if (response.equals(PasswordValidator.REQUIREMENT_MSG)) {
            return ResponseEntity.badRequest().body(response);
        }
        if (response.startsWith("Please verify your email")) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

@Autowired
private JwtUtil jwtUtil;

@Autowired
private AdminAuditLogService adminAuditLogService;

@Autowired
private AdminSettingsStoreService adminSettingsStoreService;

private String maintenanceMessage() {
    String start = adminSettingsStoreService.getString("maintenanceStart", "");
    String end = adminSettingsStoreService.getString("maintenanceEnd", "");
    if (!start.isBlank() || !end.isBlank()) {
        String window = (start.isBlank() ? "now" : start) + " to " + (end.isBlank() ? "until further notice" : end);
        return "The application is currently in maintenance mode (" + window + "). Please try again later.";
    }
    return "The application is currently in maintenance mode. Please try again later.";
}

@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody RegisterRequest request, HttpServletRequest httpRequest) {

    Optional<?> userOpt = userService.getUserByEmail(request.getEmail());

    if (userOpt.isEmpty()) {
        return ResponseEntity.badRequest().body("Invalid credentials");
    }

    User user = (User) userOpt.get();
    boolean isAdmin = AdminAuditLogService.isAdminRole(user.getRole());

    // During maintenance, allow only admins to log in.
    if (adminSettingsStoreService.getBoolean("maintenanceMode", false) && !isAdmin) {
        return ResponseEntity.status(403).body(maintenanceMessage());
    }

    // Blocked users cannot log in
    if (!user.isActive()) {
        return ResponseEntity.status(403).body("Your account has been blocked. Please contact support.");
    }

    boolean isValid = userService.validateUser(request.getEmail(), request.getPassword());

    if (!isValid) {
        return ResponseEntity.badRequest().body("Invalid credentials");
    }

    String token = jwtUtil.generateToken(user.getEmail());

    if (isAdmin) {
        adminAuditLogService.logForUser(user, "Admin Login", "Signed in with password", httpRequest);
    }

    return ResponseEntity.ok(Map.of(
            "token", token,
            "role", user.getRole()
    ));
}

    /**
     * Records admin logout in audit (JWT-only). Safe to call without a body; ignores invalid/missing tokens.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       HttpServletRequest httpRequest) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.noContent().build();
        }
        String token = authHeader.substring(7);
        String email;
        try {
            email = jwtUtil.extractEmail(token);
        } catch (Exception e) {
            return ResponseEntity.noContent().build();
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.noContent().build();
        }
        Optional<?> userOpt = userService.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        User user = (User) userOpt.get();
        if (AdminAuditLogService.isAdminRole(user.getRole())) {
            adminAuditLogService.logForUser(user, "Admin Logout", "Session ended", httpRequest);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        var resultOpt = userService.requestPasswordReset(email.trim());
        if (resultOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "userFound", false,
                    "message", "No account found with this email. Please register first."
            ));
        }
        var result = resultOpt.get();
        if (result.isEmailSent()) {
            return ResponseEntity.ok(Map.of(
                    "userFound", true,
                    "message", "A 6-digit OTP has been sent to your email. Valid for 10 minutes. Check your inbox (and spam)."
            ));
        }
        // For security, never expose the OTP in API responses.
        // If email sending fails, still return a generic message.
        return ResponseEntity.ok(Map.of(
                "userFound", true,
                "message", "A 6-digit OTP has been generated. Please check your email. If you do not receive it, try again or contact support."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String otp = body != null ? body.get("otp") : null;
        String newPassword = body != null ? body.get("newPassword") : null;
        if (email == null || email.isBlank() || otp == null || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Email, OTP and new password are required");
        }
        if (!PasswordValidator.isValid(newPassword)) {
            return ResponseEntity.badRequest().body(PasswordValidator.REQUIREMENT_MSG);
        }
        boolean success = userService.resetPasswordWithOtp(email.trim(), otp, newPassword);
        if (!success) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP. Please request a new one.");
        }
        return ResponseEntity.ok("Password has been reset. You can now log in.");
    }

    @GetMapping("/api/test")
    public String test() {
        return "Protected API working!";
    }

@GetMapping("/me")
public ResponseEntity<?> getProfile(
        @RequestHeader(value = "Authorization", required = false) String authHeader) {

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }

    String token = authHeader.substring(7).trim();
    if (token.isEmpty() || !jwtUtil.validateToken(token)) {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
    }

    String email;
    try {
        email = jwtUtil.extractEmail(token);
    } catch (Exception e) {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
    }

    Optional<?> userOpt = userService.getUserByEmail(email);

    if (userOpt.isEmpty()) {
        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    com.carbon.carbontracker.model.User user =
            (com.carbon.carbontracker.model.User) userOpt.get();

    return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole()
    ));
}

@PutMapping("/profile")
public ResponseEntity<?> updateProfile(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody Map<String, String> body) {

    String token = authHeader.replace("Bearer ", "");
    String email = jwtUtil.extractEmail(token);

    String name = body.get("name");
    String newEmail = body.get("email");
    String password = body.get("password");

    boolean updated = userService.updateUserProfile(email, name, newEmail, password);

    if (!updated) {
        return ResponseEntity.badRequest().body("Profile update failed");
    }

    return ResponseEntity.ok("Profile updated successfully");
}
}
