package com.carbon.carbontracker.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateLogRequest {

    private BigDecimal transportEmission;
    private BigDecimal foodEmission;
    private BigDecimal energyEmission;
    private BigDecimal totalEmission;

    // lifestyle choices for this log
    private String transportMode;
    private Double distancePerDay;
    private String fuelType;

    private String dietType;
    private Integer mealsPerDay;
    private String eatingOutFrequency;

    private Double monthlyElectricity;
    private Boolean renewable;
}
