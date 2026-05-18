package com.carbon.carbontracker.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;  // null = global/admin broadcast

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    private String type;  // GOAL, BADGE, LEADERBOARD, EMISSION, PURCHASE, PURCHASE_PENDING, SYSTEM, ...

    @Column(name = "is_read")
    @JsonProperty("read")
    private Boolean isRead = false;

    /** If true, user has dismissed this notification in the UI. Admins still see it. */
    @Column(name = "hidden_for_user")
    private Boolean hiddenForUser = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "admin_name")
    private String adminName;

    @Column(name = "ip_address")
    private String ipAddress;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = createdAt;
        if (isRead == null) {
            isRead = false;
        }
        if (hiddenForUser == null) {
            hiddenForUser = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}