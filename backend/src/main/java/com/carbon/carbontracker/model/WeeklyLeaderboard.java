package com.carbon.carbontracker.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_leaderboard")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyLeaderboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "week_end", nullable = false)
    private LocalDate weekEnd;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "rank_position", nullable = false)
    private Integer rankPosition;

    /** Sum of carbon_offset from successful purchases at snapshot time (scoring input). */
    @Column(name = "marketplace_carbon_offset", nullable = false)
    private Double marketplaceCarbonOffset;

    @Column(name = "goals_completed", nullable = false)
    private Integer goalsCompleted;

    @Column(name = "badges_earned", nullable = false)
    private Integer badgesEarned;

    @Column(name = "score", nullable = false)
    private Double score;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
