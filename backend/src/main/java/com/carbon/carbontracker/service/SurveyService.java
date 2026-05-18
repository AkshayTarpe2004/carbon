package com.carbon.carbontracker.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import com.carbon.carbontracker.dto.SurveyRequest;
import com.carbon.carbontracker.repository.*;
import com.carbon.carbontracker.model.*;
@Service
public class SurveyService {

    @Autowired private SurveyRepository surveyRepository;
    @Autowired private CarbonCalculationService calculationService;
    @Autowired private CarbonLogService carbonLogService;
    @Autowired private BadgeRuleService badgeRuleService;
    @Autowired private UserRepository userRepository;

    public void processSurvey(SurveyRequest request, String email) {

        User user = userRepository.findByEmailNormalized(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        double transport = calculationService.calculateTransport(request);
        double food = calculationService.calculateFood(request);
        double energy = calculationService.calculateEnergy(request);

        double total = transport + food + energy;

        carbonLogService.createOrUpdateLog(user, transport, food, energy, total, request);

        Survey survey = Survey.builder()
                .transportMode(request.getTransportMode())
                .dietType(request.getDietType())
                .energyUsage(request.getMonthlyElectricity())
                .frequency(request.getEatingOutFrequency())
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        surveyRepository.save(survey);

        // Badge rules related to survey submission
        badgeRuleService.afterSurveySubmitted(user.getId());
    }
}