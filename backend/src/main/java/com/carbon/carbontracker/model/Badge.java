package com.carbon.carbontracker.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_name", nullable = false)
    private String badgeName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "awarded_at")
    private LocalDateTime awardedAt;

    @PrePersist
    protected void onAward() {
        this.awardedAt = LocalDateTime.now();
    }
}