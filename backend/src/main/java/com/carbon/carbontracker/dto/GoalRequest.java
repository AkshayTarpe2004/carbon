
package com.carbon.carbontracker.dto;

import com.carbon.carbontracker.model.Goal.GoalStatus;
import lombok.Data;
import java.time.LocalDate;
import java.math.BigDecimal;

@Data
public class GoalRequest {

    private String goalTitle;
private String category;
private Integer reductionTarget;
private String timeframe;
private String description;

private BigDecimal targetEmission;
private BigDecimal currentEmission;

private LocalDate startDate;
private LocalDate endDate;

private GoalStatus status;
}
