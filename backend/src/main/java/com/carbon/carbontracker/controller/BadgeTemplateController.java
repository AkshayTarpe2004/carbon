package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.model.BadgeTemplate;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.BadgeTemplateService;
import com.carbon.carbontracker.util.ClientIpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badge-templates")
@RequiredArgsConstructor
public class BadgeTemplateController {

    private final BadgeTemplateService badgeTemplateService;
    private final AdminAuditLogService adminAuditLogService;

    @GetMapping
    public ResponseEntity<List<BadgeTemplate>> getAll() {
        return ResponseEntity.ok(badgeTemplateService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BadgeTemplate> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(badgeTemplateService.getById(id));
    }

    @PostMapping
    public ResponseEntity<BadgeTemplate> create(@RequestBody BadgeTemplate template, HttpServletRequest request) {
        BadgeTemplate created = badgeTemplateService.create(template, ClientIpUtil.resolve(request));
        adminAuditLogService.log(
                "Badge Template Created",
                created.getName() != null ? created.getName() : "",
                request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BadgeTemplate> update(@PathVariable Long id, @RequestBody BadgeTemplate updated,
                                                HttpServletRequest request) {
        BadgeTemplate saved = badgeTemplateService.update(id, updated, ClientIpUtil.resolve(request));
        adminAuditLogService.log(
                "Badge Template Updated",
                saved.getName() != null ? saved.getName() : ("id " + id),
                request);
        return ResponseEntity.ok(saved);
    }
}

