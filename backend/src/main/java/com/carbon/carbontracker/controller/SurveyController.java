package com.carbon.carbontracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import com.carbon.carbontracker.dto.SurveyRequest;
import com.carbon.carbontracker.dto.SurveyPreviewResponse;
import com.carbon.carbontracker.service.SurveyService;
import com.carbon.carbontracker.service.CarbonCalculationService;

@RestController
@RequestMapping("/api")
public class SurveyController {

    @Autowired
    private SurveyService surveyService;

    @Autowired
    private CarbonCalculationService calculationService;

    @PostMapping("/survey")
    public ResponseEntity<?> submitSurvey(
            @RequestBody SurveyRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        surveyService.processSurvey(request, email);

        return ResponseEntity.ok("Survey submitted successfully");
    }

    @PostMapping("/survey/preview")
    public ResponseEntity<SurveyPreviewResponse> previewSurvey(
            @RequestBody SurveyRequest request
    ) {
        double transport = calculationService.calculateTransport(request);
        double food = calculationService.calculateFood(request);
        double energy = calculationService.calculateEnergy(request);
        double total = transport + food + energy;
        return ResponseEntity.ok(new SurveyPreviewResponse(transport, food, energy, total));
    }
}