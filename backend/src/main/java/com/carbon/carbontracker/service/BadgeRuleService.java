package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.BadgeRequest;
import com.carbon.carbontracker.model.BadgeTemplate;
import com.carbon.carbontracker.model.CarbonLog;
import com.carbon.carbontracker.model.Goal;
import com.carbon.carbontracker.model.Survey;
import com.carbon.carbontracker.model.TransactionStatus;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.BadgeTemplateRepository;
import com.carbon.carbontracker.repository.CarbonLogRepository;
import com.carbon.carbontracker.repository.GoalRepository;
import com.carbon.carbontracker.repository.SurveyRepository;
import com.carbon.carbontracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BadgeRuleService {

    private static final BigDecimal TEN = BigDecimal.valueOf(10);
    private static final BigDecimal EIGHT = BigDecimal.valueOf(8);
    private static final BigDecimal FIVE = BigDecimal.valueOf(5);
    private static final BigDecimal POINT_O_FIVE = new BigDecimal("0.05");
    private static final BigDecimal TREE_PLANTER_OFFSET_KG = BigDecimal.valueOf(100);

    private final BadgeTemplateRepository badgeTemplateRepository;
    private final BadgeService badgeService;
    private final CarbonLogRepository carbonLogRepository;
    private final GoalRepository goalRepository;
    private final SurveyRepository surveyRepository;
    private final TransactionRepository transactionRepository;

    public BadgeRuleService(
            BadgeTemplateRepository badgeTemplateRepository,
            BadgeService badgeService,
            CarbonLogRepository carbonLogRepository,
            GoalRepository goalRepository,
            SurveyRepository surveyRepository,
            TransactionRepository transactionRepository
    ) {
        this.badgeTemplateRepository = badgeTemplateRepository;
        this.badgeService = badgeService;
        this.carbonLogRepository = carbonLogRepository;
        this.goalRepository = goalRepository;
        this.surveyRepository = surveyRepository;
        this.transactionRepository = transactionRepository;
    }

    private Optional<BadgeTemplate> byCode(String code) {
        return badgeTemplateRepository.findByCode(code);
    }

    private void safeAward(Long userId, String code) {
        byCode(code).ifPresent(tpl -> {
            BadgeRequest req = new BadgeRequest();
            req.setBadgeName(tpl.getName());
            req.setDescription(tpl.getDescription());
            try {
                badgeService.awardBadge(userId, req);
            } catch (RuntimeException ignored) {
                // duplicate award or missing template
            }
        });
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static LocalDate weekStartMonday(LocalDate d) {
        return d.with(DayOfWeek.MONDAY);
    }

    /** One row per calendar day (latest log wins if multiple). */
    private static Map<LocalDate, CarbonLog> latestLogPerDay(List<CarbonLog> logs) {
        return logs.stream()
                .filter(l -> l.getDate() != null)
                .collect(Collectors.toMap(
                        CarbonLog::getDate,
                        Function.identity(),
                        (a, b) -> {
                            Long ai = a.getId();
                            Long bi = b.getId();
                            if (ai == null) {
                                return b;
                            }
                            if (bi == null) {
                                return a;
                            }
                            return ai >= bi ? a : b;
                        }
                ));
    }

    private static int longestConsecutiveDayStreak(List<LocalDate> sortedUniqueDates) {
        if (sortedUniqueDates.isEmpty()) {
            return 0;
        }
        int best = 1;
        int run = 1;
        for (int i = 1; i < sortedUniqueDates.size(); i++) {
            LocalDate cur = sortedUniqueDates.get(i);
            LocalDate prev = sortedUniqueDates.get(i - 1);
            if (cur.equals(prev.plusDays(1))) {
                run++;
                best = Math.max(best, run);
            } else {
                run = 1;
            }
        }
        return best;
    }

    private void evaluateLogPatternBadges(Long userId, List<CarbonLog> logs, LocalDate today) {
        if (logs.isEmpty()) {
            return;
        }

        Map<LocalDate, CarbonLog> byDay = latestLogPerDay(logs);

        List<LocalDate> allDaysSorted = new ArrayList<>(byDay.keySet());
        Collections.sort(allDaysSorted);
        if (longestConsecutiveDayStreak(allDaysSorted) >= 7) {
            safeAward(userId, "WEEK_WARRIOR");
        }

        long daysUnderTen = byDay.values().stream()
                .map(l -> nz(l.getTotalEmission()))
                .filter(t -> t.compareTo(TEN) < 0)
                .count();
        if (daysUnderTen >= 5) {
            safeAward(userId, "LOW_EMITTER");
        }

        List<LocalDate> lowStreakDays = byDay.entrySet().stream()
                .filter(e -> nz(e.getValue().getTotalEmission()).compareTo(TEN) < 0)
                .map(Map.Entry::getKey)
                .sorted()
                .collect(Collectors.toList());
        if (longestConsecutiveDayStreak(lowStreakDays) >= 14) {
            safeAward(userId, "ECO_STREAK");
        }

        List<LocalDate> plantDays = byDay.entrySet().stream()
                .filter(e -> nz(e.getValue().getFoodEmission()).compareTo(FIVE) < 0)
                .map(Map.Entry::getKey)
                .sorted()
                .collect(Collectors.toList());
        if (longestConsecutiveDayStreak(plantDays) >= 14) {
            safeAward(userId, "PLANT_BASED_HERO");
        }

        List<LocalDate> energySaverDays = byDay.entrySet().stream()
                .filter(e -> nz(e.getValue().getEnergyEmission()).compareTo(EIGHT) < 0)
                .map(Map.Entry::getKey)
                .sorted()
                .collect(Collectors.toList());
        if (longestConsecutiveDayStreak(energySaverDays) >= 30) {
            safeAward(userId, "ENERGY_SAVER");
        }

        List<LocalDate> solarDays = byDay.entrySet().stream()
                .filter(e -> nz(e.getValue().getEnergyEmission()).abs().compareTo(POINT_O_FIVE) < 0)
                .map(Map.Entry::getKey)
                .sorted()
                .collect(Collectors.toList());
        if (longestConsecutiveDayStreak(solarDays) >= 7) {
            safeAward(userId, "SOLAR_HERO");
        }

        LocalDate from = today.minusDays(29);
        List<CarbonLog> recent = logs.stream()
                .filter(l -> l.getDate() != null && !l.getDate().isBefore(from))
                .collect(Collectors.toList());
        if (recent.size() >= 5) {
            long publicCount = recent.stream()
                    .filter(l -> {
                        String m = l.getTransportMode();
                        return m != null && "PUBLIC".equalsIgnoreCase(m.trim());
                    })
                    .count();
            if (publicCount * 100L >= recent.size() * 70L) {
                safeAward(userId, "PUBLIC_TRANSPORT_PRO");
            }
        }

        Set<LocalDate> weekStarts = logs.stream()
                .map(CarbonLog::getDate)
                .filter(Objects::nonNull)
                .map(BadgeRuleService::weekStartMonday)
                .collect(Collectors.toSet());
        List<LocalDate> sortedWeeks = new ArrayList<>(weekStarts);
        Collections.sort(sortedWeeks);
        int weekRun = 1;
        int bestWeeks = sortedWeeks.isEmpty() ? 0 : 1;
        for (int i = 1; i < sortedWeeks.size(); i++) {
            if (sortedWeeks.get(i).equals(sortedWeeks.get(i - 1).plusWeeks(1))) {
                weekRun++;
                bestWeeks = Math.max(bestWeeks, weekRun);
            } else {
                weekRun = 1;
            }
        }
        if (bestWeeks >= 8) {
            safeAward(userId, "WEEKLY_CHECKIN");
        }

        BigDecimal last30 = nz(carbonLogRepository.sumEmissionsByUserAndDateRange(userId, today.minusDays(29), today));
        BigDecimal prev30 = nz(carbonLogRepository.sumEmissionsByUserAndDateRange(userId, today.minusDays(59), today.minusDays(30)));
        if (prev30.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal drop = prev30.subtract(last30);
            BigDecimal ratio = drop.divide(prev30, 4, RoundingMode.HALF_UP);
            if (ratio.compareTo(new BigDecimal("0.20")) >= 0) {
                safeAward(userId, "CARBON_CUTTER");
                safeAward(userId, "CARBON_SAVER");
            }
        }
    }

    public void afterCarbonLogSaved(User user) {
        Long userId = user.getId();

        List<CarbonLog> logsForUser = carbonLogRepository.findByUser(user);
        int totalLogs = logsForUser.size();
        LocalDate today = LocalDate.now();

        if (totalLogs == 1) {
            safeAward(userId, "FIRST_LOG");
        }
        if (totalLogs >= 100) {
            safeAward(userId, "CONSISTENCY_KING");
        }

        evaluateLogPatternBadges(userId, logsForUser, today);
    }

    public void afterGoalCreated(Long userId) {
        long totalGoals = goalRepository.findByUser_Id(userId).size();
        if (totalGoals == 1L) {
            safeAward(userId, "GOAL_SETTER");
        }
    }

    public void afterGoalStatusUpdated(Long userId, Goal.GoalStatus newStatus) {
        if (newStatus == Goal.GoalStatus.COMPLETED) {
            long completed = goalRepository.countByUser_IdAndStatus(userId, Goal.GoalStatus.COMPLETED);
            if (completed >= 1L) {
                safeAward(userId, "GOAL_ACHIEVER");
                safeAward(userId, "GREEN_ACHIEVER");
            }
        }
    }

    public void afterSurveySubmitted(Long userId) {
        long count = surveyRepository.countByUser_Id(userId);

        if (count == 1L) {
            safeAward(userId, "ECO_STARTER");
        }
        if (count >= 1L) {
            safeAward(userId, "SURVEY_MASTER");
        }

        long nightSurveys = surveyRepository.findByUser_Id(userId).stream()
                .map(Survey::getCreatedAt)
                .filter(Objects::nonNull)
                .filter(BadgeRuleService::isNightHour)
                .count();
        if (nightSurveys >= 5) {
            safeAward(userId, "NIGHT_LOGGER");
        }
    }

    private static boolean isNightHour(LocalDateTime dt) {
        int h = dt.getHour();
        return h >= 22 || h <= 4;
    }

    public void onLeaderboardPosition(Long userId, int rank, int totalUsers) {
        if (totalUsers <= 0) {
            return;
        }
        int cutoff = (int) Math.ceil(totalUsers * 0.10);
        if (rank > 0 && rank <= cutoff) {
            safeAward(userId, "GREEN_CHAMPION");
        }
    }

    /** Call after marketplace purchases settle so offset totals can unlock badges. */
    public void afterCarbonOffsetTotalMayHaveChanged(Long userId) {
        BigDecimal sum = transactionRepository.sumCarbonOffsetByUser_IdAndStatus(userId, TransactionStatus.SUCCESS);
        if (sum != null && sum.compareTo(TREE_PLANTER_OFFSET_KG) >= 0) {
            safeAward(userId, "TREE_PLANTER");
        }
    }
}
