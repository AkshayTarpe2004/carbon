package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LatestEmissionResponse {
    private BigDecimal totalEmission;
    private LocalDate date;
}
