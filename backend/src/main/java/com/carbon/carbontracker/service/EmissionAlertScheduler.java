package com.carbon.carbontracker.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.carbon.carbontracker.service.EmissionAlertService;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class EmissionAlertScheduler {

    private final EmissionAlertService emissionAlertService;

    // Runs every Monday at 9 AM (India time)
    @Scheduled(cron = "0 0 9 * * MON", zone = "Asia/Kolkata")
    public void weeklyEmissionCheck() {
        System.out.println("Scheduler triggered at: " + LocalDateTime.now());
        emissionAlertService.checkAndAlertHighEmissions();
    }
}