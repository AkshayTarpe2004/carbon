
package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.NotificationService;
import com.carbon.carbontracker.dto.NotificationDTO;
import com.carbon.carbontracker.util.ClientIpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.carbon.carbontracker.model.Notification;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AdminAuditLogService adminAuditLogService;

    // USER: Get notifications
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    // USER: Mark as read
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    // USER: Dismiss (hide) notification – keeps it visible to admin
    @PutMapping("/{id}/hide")
    public ResponseEntity<Notification> hideNotification(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.hideForUser(id));
    }

    // ADMIN: Create notification
    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody NotificationDTO dto,
                                                           HttpServletRequest request) {
        Notification n = notificationService.createNotification(
            dto.getUserId(), dto.getTitle(), dto.getMessage(), dto.getType(), ClientIpUtil.resolve(request)
        );
        adminAuditLogService.log(
                "Notification Created",
                n.getTitle() != null ? n.getTitle() : "",
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(n);
    }

    // ADMIN: Edit notification
    @PutMapping("/{id}")
    public ResponseEntity<Notification> updateNotification(@PathVariable Long id, @RequestBody NotificationDTO dto,
                                                           HttpServletRequest request) {
        return ResponseEntity.ok(notificationService.updateNotification(id, dto.getTitle(), dto.getMessage(),
                ClientIpUtil.resolve(request)));
    }

    // ADMIN: Delete notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, HttpServletRequest request) {
        Notification n = notificationService.getNotificationById(id);
        notificationService.deleteNotification(id);
        adminAuditLogService.log(
                "Notification Deleted",
                n.getTitle() != null ? n.getTitle() : ("id " + id),
                request);
        return ResponseEntity.noContent().build();
    }

    // ADMIN: Get all notifications
    @GetMapping("/admin/all")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }
}