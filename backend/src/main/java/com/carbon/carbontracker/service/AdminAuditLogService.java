package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.AdminAuditLogDTO;
import com.carbon.carbontracker.model.AdminAuditLog;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.AdminAuditLogRepository;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.util.ClientIpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAuditLogService {

    private final AdminAuditLogRepository adminAuditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(String action, String details, HttpServletRequest request) {
        String email = null;
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                email = auth.getName();
            }
        } catch (Exception ignored) {
            /* ignore */
        }
        User user = (email != null && !email.isBlank())
                ? userRepository.findByEmail(email).orElse(null)
                : null;
        String name = user != null
                ? (user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail())
                : (email != null ? email : "Unknown");

        AdminAuditLog entry = AdminAuditLog.builder()
                .adminUserId(user != null ? user.getId() : null)
                .adminName(name)
                .adminEmail(email != null ? email : "")
                .action(action)
                .details(details)
                .ipAddress(ClientIpUtil.resolve(request))
                .build();
        adminAuditLogRepository.save(entry);
    }

    /**
     * Persists an audit row for a known user (e.g. login before JWT is in SecurityContext, or logout).
     */
    @Transactional
    public void logForUser(User user, String action, String details, HttpServletRequest request) {
        if (user == null) {
            return;
        }
        String name = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : (user.getEmail() != null ? user.getEmail() : "Unknown");
        AdminAuditLog entry = AdminAuditLog.builder()
                .adminUserId(user.getId())
                .adminName(name)
                .adminEmail(user.getEmail() != null ? user.getEmail() : "")
                .action(action)
                .details(details)
                .ipAddress(ClientIpUtil.resolve(request))
                .build();
        adminAuditLogRepository.save(entry);
    }

    public static boolean isAdminRole(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }
        return "ADMIN".equalsIgnoreCase(role.trim());
    }

    public List<AdminAuditLogDTO> findRecentForAdmin() {
        return adminAuditLogRepository
                .findRecent(PageRequest.of(0, 500))
                .stream()
                .map(this::toDto)
                .toList();
    }

    private AdminAuditLogDTO toDto(AdminAuditLog e) {
        return AdminAuditLogDTO.builder()
                .id(e.getId())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : "")
                .adminName(e.getAdminName())
                .action(e.getAction())
                .details(e.getDetails())
                .ipAddress(e.getIpAddress())
                .build();
    }
}
