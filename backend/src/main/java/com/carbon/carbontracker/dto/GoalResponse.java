
package com.carbon.carbontracker.dto;

import com.carbon.carbontracker.model.Goal.GoalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String goalTitle;
    private BigDecimal baselineEmission;
    private BigDecimal targetReductionKg;
    private BigDecimal currentReductionKg;
    private BigDecimal targetEmission;
    private BigDecimal currentEmission;
    private Double progressPercentage;
    private GoalStatus status;
    private LocalDateTime createdAt;
    private String category;
    private Integer reductionTarget;
    private String timeframe;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
}
