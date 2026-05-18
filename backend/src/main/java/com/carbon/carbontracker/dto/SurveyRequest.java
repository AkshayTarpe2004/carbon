package com.carbon.carbontracker.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SurveyRequest {

    private String transportMode;     // CAR, BIKE, PUBLIC, WALK, WFH
    private Double distancePerDay;
    private String fuelType;          // PETROL, DIESEL, ELECTRIC, HYBRID

    private String dietType;          // VEG, NON_VEG, VEGAN
    private Integer mealsPerDay;
    private String eatingOutFrequency;

    private Double monthlyElectricity;
    private Boolean renewable;
}