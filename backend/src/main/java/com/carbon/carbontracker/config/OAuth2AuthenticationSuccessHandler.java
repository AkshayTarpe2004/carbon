package com.carbon.carbontracker.config;

import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.AdminSettingsStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Value("${app.oauth2.authorizedRedirectUri}")
    private String authorizedRedirectUri;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminAuditLogService adminAuditLogService;

    @Autowired
    private AdminSettingsStoreService adminSettingsStoreService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication type not supported");
            return;
        }

        Map<String, Object> attributes = oauthToken.getPrincipal().getAttributes();
        String provider = oauthToken.getAuthorizedClientRegistrationId();

        // Provider-agnostic: get email (Google), or login (GitHub), or id
        String email = getStringAttr(attributes, "email");
        String login = getStringAttr(attributes, "login");
        Object idAttr = attributes.get("id");
        String id = idAttr != null ? idAttr.toString() : null;

        String subject = email;
        if (subject == null || subject.isBlank()) {
            subject = login;
        }
        if ((subject == null || subject.isBlank()) && id != null) {
            subject = "oauth_" + provider + "_" + id;
        }
        if (subject == null || subject.isBlank()) {
            subject = "oauth_" + provider + "_" + System.currentTimeMillis();
        }

        String name = getStringAttr(attributes, "name");
        if (name == null || name.isBlank()) {
            name = login != null ? login : subject;
        }

        String emailToStore = (email != null && !email.isBlank()) ? email : subject;
        if (emailToStore != null && !emailToStore.isBlank()) {
            String finalEmail = emailToStore;
            String finalName = name;
            boolean maintenanceOn = adminSettingsStoreService.getBoolean("maintenanceMode", false);
            String maintenanceStart = adminSettingsStoreService.getString("maintenanceStart", "");
            String maintenanceEnd = adminSettingsStoreService.getString("maintenanceEnd", "");

            Optional<User> existingOpt = userRepository.findByEmailNormalized(finalEmail);

            // If user exists and is blocked, deny login
            if (existingOpt.isPresent()) {
                User existing = existingOpt.get();
                if (!existing.isActive()) {
                    String blockedRedirect = UriComponentsBuilder
                            .fromUriString(authorizedRedirectUri)
                            .queryParam("error", "blocked")
                            .build()
                            .toUriString();
                    response.sendRedirect(blockedRedirect);
                    return;
                }
                // During maintenance, allow only admins.
                if (maintenanceOn && !AdminAuditLogService.isAdminRole(existing.getRole())) {
                    String blockedRedirect = UriComponentsBuilder
                            .fromUriString(authorizedRedirectUri)
                            .queryParam("error", "maintenance")
                            .queryParam("maintenanceStart", maintenanceStart)
                            .queryParam("maintenanceEnd", maintenanceEnd)
                            .build()
                            .toUriString();
                    response.sendRedirect(blockedRedirect);
                    return;
                }
            } else {
                // During maintenance, do not allow new non-admin OAuth sign-ins.
                if (maintenanceOn) {
                    String blockedRedirect = UriComponentsBuilder
                            .fromUriString(authorizedRedirectUri)
                            .queryParam("error", "maintenance")
                            .queryParam("maintenanceStart", maintenanceStart)
                            .queryParam("maintenanceEnd", maintenanceEnd)
                            .build()
                            .toUriString();
                    response.sendRedirect(blockedRedirect);
                    return;
                }
                // Create new active user with default USER role
                User user = User.builder()
                        .name(finalName)
                        .email(finalEmail)
                        .createdAt(LocalDateTime.now())
                        .role("USER")
                        .active(true)
                        .build();
                userRepository.save(user);
            }
        }

        if (emailToStore != null && !emailToStore.isBlank()) {
            userRepository.findByEmailNormalized(emailToStore).ifPresent(u -> {
                if (AdminAuditLogService.isAdminRole(u.getRole())) {
                    adminAuditLogService.logForUser(u, "Admin Login",
                            "Signed in with OAuth (" + provider + ")", request);
                }
            });
        }

        // JWT subject must match users.email (used by API lookups after OAuth).
        String jwtSubject = subject;
        if (emailToStore != null && !emailToStore.isBlank()) {
            jwtSubject = userRepository.findByEmailNormalized(emailToStore)
                    .map(User::getEmail)
                    .orElse(subject);
        }

        String token = jwtUtil.generateToken(jwtSubject);

        String redirectUrl = UriComponentsBuilder
                .fromUriString(authorizedRedirectUri)
                .queryParam("token", token)
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private static String getStringAttr(Map<String, Object> attributes, String key) {
        Object v = attributes.get(key);
        return v != null ? v.toString().trim() : null;
    }
}

