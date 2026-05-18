package com.carbon.carbontracker.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.List;
import java.math.BigDecimal;

import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.repository.CarbonLogRepository;
import com.carbon.carbontracker.model.User;

@Service
@RequiredArgsConstructor
public class EmissionAlertService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final CarbonLogRepository carbonLogRepository;

    private static final double EMISSION_THRESHOLD_PERCENT = 15.0;

    public void checkAndAlertHighEmissions() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            double increasePercent = calculateWeeklyEmissionIncrease(user.getId());

            if (increasePercent > EMISSION_THRESHOLD_PERCENT) {
                notificationService.createHighEmissionNotification(user, increasePercent);
            }
        }
    }

    private double calculateWeeklyEmissionIncrease(Long userId) {

    LocalDate now = LocalDate.now();

    // Current week
    LocalDate startOfThisWeek = now.with(DayOfWeek.MONDAY);
    LocalDate endOfThisWeek = now.with(DayOfWeek.SUNDAY);

    // Last week
    LocalDate startOfLastWeek = startOfThisWeek.minusWeeks(1);
    LocalDate endOfLastWeek = endOfThisWeek.minusWeeks(1);

    BigDecimal thisWeekEmission = carbonLogRepository
            .sumEmissionsByUserAndDateRange(userId, startOfThisWeek, endOfThisWeek);

    BigDecimal lastWeekEmission = carbonLogRepository
            .sumEmissionsByUserAndDateRange(userId, startOfLastWeek, endOfLastWeek);

    // ✅ Handle nulls
    if (thisWeekEmission == null) thisWeekEmission = BigDecimal.ZERO;
    if (lastWeekEmission == null) lastWeekEmission = BigDecimal.ZERO;

    // ✅ Avoid division by zero
    if (lastWeekEmission.compareTo(BigDecimal.ZERO) == 0) {
        return thisWeekEmission.compareTo(BigDecimal.ZERO) > 0 ? 100 : 0;
    }

    // ✅ ((this - last) / last) * 100
    BigDecimal difference = thisWeekEmission.subtract(lastWeekEmission);

    BigDecimal percentIncrease = difference
            .divide(lastWeekEmission, 2, java.math.RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

    return percentIncrease.doubleValue();
}
}