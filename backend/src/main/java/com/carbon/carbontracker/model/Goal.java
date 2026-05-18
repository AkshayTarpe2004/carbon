package com.carbon.carbontracker.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    public enum GoalStatus {
        ACTIVE, COMPLETED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // -----------------------------
    // USER RELATION
    // -----------------------------
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // -----------------------------
    // GOAL BASIC INFO
    // -----------------------------
    @Column(name = "goal_title", nullable = false)
    private String goalTitle;

    @Column(name = "category")
    private String category;   // Transport / Food / Energy

    @Column(name = "reduction_target")
    private Integer reductionTarget; // % reduction

    @Column(name = "timeframe")
    private String timeframe; // Next 7 days / 30 days

    @Column(name = "description")
    private String description;

    // -----------------------------
    // EMISSION DATA
    // -----------------------------
    /** Total footprint (kg CO₂) when the goal was created — from latest carbon log at creation time. */
    @Column(name = "baseline_emission", precision = 14, scale = 4)
    private BigDecimal baselineEmission;

    /** How much to reduce from baseline (kg CO₂), e.g. 20% of baseline → stored as kg. */
    @Column(name = "target_reduction_kg", precision = 14, scale = 4)
    private BigDecimal targetReductionKg;

    /** max(0, baseline − current footprint) after latest survey. */
    @Column(name = "current_reduction_kg", precision = 14, scale = 4)
    private BigDecimal currentReductionKg;

    @Column(name = "target_emission", precision = 10, scale = 2)
    private BigDecimal targetEmission;

    @Column(name = "current_emission", precision = 10, scale = 2)
    private BigDecimal currentEmission = BigDecimal.ZERO;

    // -----------------------------
    // DATE RANGE
    // -----------------------------
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // -----------------------------
    // PROGRESS
    // -----------------------------
    @Column(name = "progress_percentage")
    private Double progressPercentage = 0.0;

    // -----------------------------
    // STATUS
    // -----------------------------
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GoalStatus status;

    // -----------------------------
    // CREATED DATE
    // -----------------------------
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {

        this.createdAt = LocalDateTime.now();

        if (this.status == null) {
            this.status = GoalStatus.ACTIVE;
        }

        if (this.currentEmission == null) {
            this.currentEmission = BigDecimal.ZERO;
        }

        if (this.currentReductionKg == null) {
            this.currentReductionKg = BigDecimal.ZERO;
        }

        if (this.progressPercentage == null) {
            this.progressPercentage = 0.0;
        }
    }
}
