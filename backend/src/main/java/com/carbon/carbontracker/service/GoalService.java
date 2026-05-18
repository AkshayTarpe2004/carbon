package com.carbon.carbontracker.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import com.carbon.carbontracker.dto.GoalRequest;
import com.carbon.carbontracker.dto.GoalResponse;
import com.carbon.carbontracker.model.CarbonLog;
import com.carbon.carbontracker.model.Goal;
import com.carbon.carbontracker.model.Goal.GoalStatus;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.CarbonLogRepository;
import com.carbon.carbontracker.repository.GoalRepository;
import com.carbon.carbontracker.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoalService {

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CarbonLogRepository carbonLogRepository;

    @Autowired
    private BadgeRuleService badgeRuleService;

    @Autowired
    private NotificationService notificationService;

    private void notifyGoalCompleted(Long userId, String goalTitle) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        try {
            notificationService.createGoalCompletionNotification(user, goalTitle);
        } catch (Exception ignored) {
            // Goal completion should still persist even if notification fails.
        }
    }

    /** Emissions for one category from a stored carbon log (kg CO₂). */
    private static BigDecimal categoryEmissionFromLog(CarbonLog log, String category) {
        if (log == null || category == null || category.isBlank()) {
            return BigDecimal.ZERO;
        }
        switch (category.trim().toLowerCase()) {
            case "all": {
                if (log.getTotalEmission() != null) {
                    return log.getTotalEmission();
                }
                BigDecimal sum = BigDecimal.ZERO;
                if (log.getTransportEmission() != null) {
                    sum = sum.add(log.getTransportEmission());
                }
                if (log.getFoodEmission() != null) {
                    sum = sum.add(log.getFoodEmission());
                }
                if (log.getEnergyEmission() != null) {
                    sum = sum.add(log.getEnergyEmission());
                }
                return sum;
            }
            case "transport":
                return log.getTransportEmission() != null ? log.getTransportEmission() : BigDecimal.ZERO;
            case "food":
                return log.getFoodEmission() != null ? log.getFoodEmission() : BigDecimal.ZERO;
            case "energy":
                return log.getEnergyEmission() != null ? log.getEnergyEmission() : BigDecimal.ZERO;
            default:
                return BigDecimal.ZERO;
        }
    }

    /** Emissions for one category from the latest survey breakdown (kg CO₂). */
    private static BigDecimal categoryEmissionFromParts(
            String category,
            BigDecimal transportEmission,
            BigDecimal foodEmission,
            BigDecimal energyEmission) {
        if (category == null || category.isBlank()) {
            return BigDecimal.ZERO;
        }
        switch (category.trim().toLowerCase()) {
            case "all": {
                BigDecimal sum = transportEmission != null ? transportEmission : BigDecimal.ZERO;
                sum = sum.add(foodEmission != null ? foodEmission : BigDecimal.ZERO);
                sum = sum.add(energyEmission != null ? energyEmission : BigDecimal.ZERO);
                return sum;
            }
            case "transport":
                return transportEmission != null ? transportEmission : BigDecimal.ZERO;
            case "food":
                return foodEmission != null ? foodEmission : BigDecimal.ZERO;
            case "energy":
                return energyEmission != null ? energyEmission : BigDecimal.ZERO;
            default:
                return BigDecimal.ZERO;
        }
    }

    private static boolean isKnownGoalCategory(String category) {
        if (category == null || category.isBlank()) {
            return false;
        }
        String c = category.trim().toLowerCase();
        return "all".equals(c) || "transport".equals(c) || "food".equals(c) || "energy".equals(c);
    }

    /**
     * Last calendar day (inclusive) that counts toward progress for an N-day goal window
     * starting on {@code start}. Matches UI labels: "Next 8 Days" = 8 days including start
     * → end = start + 7.
     *
     * @return {@code null} if timeframe is missing or not one of 8_days / 15_days / 30_days
     */
    private static LocalDate inclusiveEndDateFromTimeframe(LocalDate start, String timeframe) {
        if (start == null || timeframe == null || timeframe.isBlank()) {
            return null;
        }
        int n = switch (timeframe.trim().toLowerCase()) {
            case "8_days" -> 8;
            case "15_days" -> 15;
            case "30_days" -> 30;
            default -> -1;
        };
        if (n <= 0) {
            return null;
        }
        return start.plusDays(n - 1);
    }

    /**
     * Active goals whose end date is before today did not finish in time → EXPIRED.
     */
    private void expireOverdueGoals(Long userId) {
        List<Goal> active = goalRepository.findByUser_IdAndStatus(userId, GoalStatus.ACTIVE);
        LocalDate today = LocalDate.now();
        for (Goal goal : active) {
            if (goal.getEndDate() == null) {
                continue;
            }
            if (!goal.getEndDate().isBefore(today)) {
                continue;
            }
            goal.setStatus(GoalStatus.EXPIRED);
            goalRepository.save(goal);
        }
    }

    // ---------------------------------------------------------------
    // Create a new goal
    // ---------------------------------------------------------------
    public GoalResponse createGoal(Long userId, GoalRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (!isKnownGoalCategory(request.getCategory())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Choose a target category: All, transport, food, or energy.");
        }

        CarbonLog latest = carbonLogRepository.findFirstByUser_IdOrderByDateDesc(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Complete your lifestyle survey first so we can capture your baseline emissions."));

        BigDecimal baselineEmission = categoryEmissionFromLog(latest, request.getCategory());
        if (baselineEmission.compareTo(BigDecimal.ZERO) <= 0) {
            String c = request.getCategory().trim().toLowerCase();
            if ("all".equals(c)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Your latest survey has no total footprint yet; submit the lifestyle survey again.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Your latest survey has no emissions for this category. Pick another category or update your survey answers.");
        }

        int pct = request.getReductionTarget() != null ? request.getReductionTarget() : 15;
        pct = Math.max(1, Math.min(95, pct));

        BigDecimal targetReductionKg = baselineEmission
                .multiply(BigDecimal.valueOf(pct))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        if (targetReductionKg.compareTo(BigDecimal.ZERO) <= 0) {
            targetReductionKg = new BigDecimal("0.0001");
        }

        BigDecimal targetFootprint = baselineEmission.subtract(targetReductionKg);
        if (targetFootprint.compareTo(BigDecimal.ZERO) < 0) {
            targetFootprint = BigDecimal.ZERO;
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate endDate = request.getEndDate();
        if (endDate == null) {
            endDate = inclusiveEndDateFromTimeframe(startDate, request.getTimeframe());
        }

        Goal goal = Goal.builder()
                .user(user)
                .goalTitle(request.getGoalTitle())
                .category(request.getCategory())
                .reductionTarget(pct)
                .timeframe(request.getTimeframe())
                .description(request.getDescription())
                .baselineEmission(baselineEmission)
                .targetReductionKg(targetReductionKg)
                .currentReductionKg(BigDecimal.ZERO)
                .targetEmission(targetFootprint)
                .currentEmission(baselineEmission)
                .startDate(startDate)
                .endDate(endDate)
                .status(request.getStatus() != null ? request.getStatus() : GoalStatus.ACTIVE)
                .progressPercentage(0.0)
                .build();

        Goal saved = goalRepository.save(goal);

        badgeRuleService.afterGoalCreated(userId);

        return toResponse(saved);
    }

    // ---------------------------------------------------------------
    // List all goals for a user
    // ---------------------------------------------------------------
    public List<GoalResponse> getGoalsByUser(Long userId) {

        expireOverdueGoals(userId);
        return goalRepository.findByUser_IdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // List all goals for non-admin users (for admin dashboard)
    // ---------------------------------------------------------------
    public List<GoalResponse> getAllNonAdminGoals() {
        return goalRepository.findAll()
                .stream()
                .filter(goal -> {
                    String role = goal.getUser() != null ? goal.getUser().getRole() : null;
                    if (role == null) return true;
                    String r = role.trim().toLowerCase();
                    return !r.contains("admin");
                })
                .sorted(Comparator
                        .comparing(Goal::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed()
                        .thenComparing(Goal::getId, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // List goals by status
    // ---------------------------------------------------------------
    public List<GoalResponse> getGoalsByUserAndStatus(Long userId, GoalStatus status) {

        expireOverdueGoals(userId);
        return goalRepository.findByUser_IdAndStatus(userId, status)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Update goal
    // ---------------------------------------------------------------
    public GoalResponse updateGoal(Long goalId, Long userId, GoalRequest request) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found: " + goalId));

        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this goal");
        }

        if (request.getGoalTitle() != null) {
            goal.setGoalTitle(request.getGoalTitle());
        }

        if (request.getCategory() != null) {
            goal.setCategory(request.getCategory());
        }
        if (request.getReductionTarget() != null) {
            goal.setReductionTarget(request.getReductionTarget());
        }
        if (request.getStartDate() != null) {
            goal.setStartDate(request.getStartDate());
        }
        if (request.getTimeframe() != null) {
            goal.setTimeframe(request.getTimeframe());
        }
        if (request.getEndDate() != null) {
            goal.setEndDate(request.getEndDate());
        } else if (request.getStartDate() != null || request.getTimeframe() != null) {
            LocalDate start = goal.getStartDate() != null ? goal.getStartDate() : LocalDate.now();
            LocalDate computed = inclusiveEndDateFromTimeframe(start, goal.getTimeframe());
            if (computed != null) {
                goal.setEndDate(computed);
            }
        }
        if (request.getDescription() != null) {
            goal.setDescription(request.getDescription());
        }

        if (request.getTargetEmission() != null) {
            goal.setTargetEmission(request.getTargetEmission());
        }

        if (request.getCurrentEmission() != null) {
            goal.setCurrentEmission(request.getCurrentEmission());
        }

        if (request.getStatus() != null) {
            goal.setStatus(request.getStatus());
        }

        Goal updated = goalRepository.save(goal);

        // Badge rule: goal potentially completed
        badgeRuleService.afterGoalStatusUpdated(userId, updated.getStatus());

        return toResponse(updated);
    }

    // ---------------------------------------------------------------
    // Delete goal
    // ---------------------------------------------------------------
    public void deleteGoal(Long goalId, Long userId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found: " + goalId));

        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this goal");
        }

        goalRepository.delete(goal);
    }

    // ---------------------------------------------------------------
    // Convert entity to response DTO
    // ---------------------------------------------------------------
    private GoalResponse toResponse(Goal goal) {

        return GoalResponse.builder()
                .id(goal.getId())
                .userId(goal.getUser().getId())
                .userName(goal.getUser().getName() != null ? goal.getUser().getName() : goal.getUser().getEmail())
                .goalTitle(goal.getGoalTitle())
                .category(goal.getCategory())
                .reductionTarget(goal.getReductionTarget())
                .timeframe(goal.getTimeframe())
                .description(goal.getDescription())
                .baselineEmission(goal.getBaselineEmission())
                .targetReductionKg(goal.getTargetReductionKg())
                .currentReductionKg(goal.getCurrentReductionKg())
                .targetEmission(goal.getTargetEmission())
                .currentEmission(goal.getCurrentEmission())
                .progressPercentage(goal.getProgressPercentage())
                .status(goal.getStatus())
                .createdAt(goal.getCreatedAt())
                .startDate(goal.getStartDate())
                .endDate(goal.getEndDate())
                .build();
    }

    /**
     * Call after a carbon log is saved/updated. Updates baseline-based goals using each goal's
     * category (reduction = max(0, category baseline − current category emission), progress capped at 100%).
     */
    public void afterCarbonLogSaved(
            Long userId,
            BigDecimal transportEmission,
            BigDecimal foodEmission,
            BigDecimal energyEmission) {

        expireOverdueGoals(userId);
        updateGoalsProgressFromSurvey(userId, transportEmission, foodEmission, energyEmission);
        updateLegacyGoalsForUser(userId, transportEmission, foodEmission, energyEmission);
    }

    /**
     * Progress uses the goal's category: baseline and target kg are for that category only;
     * current category emission comes from the latest survey breakdown.
     */
    private void updateGoalsProgressFromSurvey(
            Long userId,
            BigDecimal transportEmission,
            BigDecimal foodEmission,
            BigDecimal energyEmission) {

        List<Goal> goals = goalRepository.findByUser_IdAndStatus(userId, GoalStatus.ACTIVE);
        LocalDate today = LocalDate.now();

        for (Goal goal : goals) {
            if (goal.getBaselineEmission() == null || goal.getTargetReductionKg() == null) {
                continue;
            }

            if (!isKnownGoalCategory(goal.getCategory())) {
                continue;
            }

            if (goal.getStartDate() != null && goal.getStartDate().isAfter(today)) {
                continue;
            }
            if (goal.getEndDate() != null && goal.getEndDate().isBefore(today)) {
                continue;
            }

            BigDecimal baseline = goal.getBaselineEmission();
            BigDecimal targetKg = goal.getTargetReductionKg();
            if (targetKg.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal currentCategory = categoryEmissionFromParts(
                    goal.getCategory(), transportEmission, foodEmission, energyEmission);

            BigDecimal rawReduction = baseline.subtract(currentCategory).max(BigDecimal.ZERO);
            BigDecimal priorBest = goal.getCurrentReductionKg() != null
                    ? goal.getCurrentReductionKg()
                    : BigDecimal.ZERO;
            // Keep best reduction achieved so progress does not snap back to 0% after a worse survey.
            BigDecimal reduction = rawReduction.max(priorBest);

            goal.setCurrentReductionKg(reduction);
            BigDecimal impliedFootprint = baseline.subtract(reduction);
            if (impliedFootprint.compareTo(BigDecimal.ZERO) < 0) {
                impliedFootprint = BigDecimal.ZERO;
            }
            goal.setCurrentEmission(impliedFootprint);

            BigDecimal progressBd = reduction
                    .multiply(BigDecimal.valueOf(100))
                    .divide(targetKg, 4, RoundingMode.HALF_UP);
            double progress = progressBd.doubleValue();
            if (progress < 0) {
                progress = 0;
            }
            if (progress > 100) {
                progress = 100;
            }
            goal.setProgressPercentage(progress);

            if (reduction.compareTo(targetKg) >= 0) {
                goal.setStatus(GoalStatus.COMPLETED);
                goal.setProgressPercentage(100.0);
                badgeRuleService.afterGoalStatusUpdated(userId, GoalStatus.COMPLETED);
                notifyGoalCompleted(userId, goal.getGoalTitle());
            }

            goalRepository.save(goal);
        }
    }

    /** Pre-baseline goals (no baseline_emission): legacy category-based accumulation. */
    private void updateLegacyGoalsForUser(
            Long userId,
            BigDecimal transportEmission,
            BigDecimal foodEmission,
            BigDecimal energyEmission) {

        List<Goal> goals = goalRepository.findByUser_IdAndStatus(userId, GoalStatus.ACTIVE);
        LocalDate today = LocalDate.now();

        for (Goal goal : goals) {
            if (goal.getBaselineEmission() != null) {
                continue;
            }

            if (goal.getStartDate() != null && goal.getStartDate().isAfter(today)) {
                continue;
            }

            if (goal.getEndDate() != null && goal.getEndDate().isBefore(today)) {
                continue;
            }

            BigDecimal emissionToAdd = BigDecimal.ZERO;

            if (goal.getCategory() != null) {
                switch (goal.getCategory().toLowerCase()) {
                    case "transport":
                        emissionToAdd = transportEmission;
                        break;
                    case "food":
                        emissionToAdd = foodEmission;
                        break;
                    case "energy":
                        emissionToAdd = energyEmission;
                        break;
                    default:
                        break;
                }
            }

            BigDecimal current = goal.getCurrentEmission();
            if (current == null) {
                current = BigDecimal.ZERO;
            }
            current = current.add(emissionToAdd);
            if (current.compareTo(BigDecimal.ZERO) < 0) {
                current = BigDecimal.ZERO;
            }
            goal.setCurrentEmission(current);

            BigDecimal target = goal.getTargetEmission();
            if (target != null && target.compareTo(BigDecimal.ZERO) > 0) {
                double progress = current.divide(target, 4, RoundingMode.HALF_UP).doubleValue() * 100;
                if (progress < 0) {
                    progress = 0;
                }
                if (progress > 100) {
                    progress = 100;
                }
                goal.setProgressPercentage(progress);
                if (current.compareTo(target) >= 0) {
                    goal.setStatus(GoalStatus.COMPLETED);
                    badgeRuleService.afterGoalStatusUpdated(userId, GoalStatus.COMPLETED);
                    notifyGoalCompleted(userId, goal.getGoalTitle());
                }
            }

            goalRepository.save(goal);
        }
    }
}
