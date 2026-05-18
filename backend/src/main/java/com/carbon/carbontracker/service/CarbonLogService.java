package com.carbon.carbontracker.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.math.BigDecimal;

import com.carbon.carbontracker.repository.CarbonLogRepository;
import com.carbon.carbontracker.model.*;

@Service
public class CarbonLogService {

    @Autowired
    private CarbonLogRepository carbonLogRepository;

    @Autowired
    private GoalService goalService;

    @Autowired
    private BadgeRuleService badgeRuleService;

    public void createOrUpdateLog(
            User user,
            double transport,
            double food,
            double energy,
            double total,
            com.carbon.carbontracker.dto.SurveyRequest request
    ) {

        LocalDate today = LocalDate.now();

        BigDecimal transportBD = BigDecimal.valueOf(transport);
        BigDecimal foodBD = BigDecimal.valueOf(food);
        BigDecimal energyBD = BigDecimal.valueOf(energy);
        BigDecimal totalBD = BigDecimal.valueOf(total);

        CarbonLog savedLog;
        // Each survey submission should create a new history row,
        // even on the same date, so users can see multiple entries.
        CarbonLog log = CarbonLog.builder()
                .user(user)
                .date(today)
                .transportEmission(transportBD)
                .foodEmission(foodBD)
                .energyEmission(energyBD)
                .totalEmission(totalBD)
                .transportMode(request.getTransportMode())
                .distancePerDay(request.getDistancePerDay())
                .fuelType(request.getFuelType())
                .dietType(request.getDietType())
                .mealsPerDay(request.getMealsPerDay())
                .eatingOutFrequency(request.getEatingOutFrequency())
                .monthlyElectricity(request.getMonthlyElectricity())
                .renewable(request.getRenewable())
                .build();

        savedLog = carbonLogRepository.save(log);

        goalService.afterCarbonLogSaved(
                savedLog.getUser().getId(),
                transportBD,
                foodBD,
                energyBD
        );

        // Badge rules based on carbon log activity
        badgeRuleService.afterCarbonLogSaved(savedLog.getUser());
    }
}