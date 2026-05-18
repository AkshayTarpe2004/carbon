package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SurveyPreviewResponse {

    private double transportEmission;
    private double foodEmission;
    private double energyEmission;
    private double totalEmission;
}

