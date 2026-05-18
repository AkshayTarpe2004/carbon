package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.AdminAuditLogDTO;
import com.carbon.carbontracker.service.AdminAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Dedicated controller for audit log reads so {@code GET /api/admin/audit-logs} is explicit and
 * easy to find in mappings (avoids confusion with other admin routes).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AdminAuditLogService adminAuditLogService;

    @GetMapping(value = "/audit-logs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<AdminAuditLogDTO>> getAuditLogs() {
        return ResponseEntity.ok(adminAuditLogService.findRecentForAdmin());
    }
}
