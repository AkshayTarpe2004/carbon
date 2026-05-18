package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.LeaderboardEntryResponse;
import com.carbon.carbontracker.model.Goal;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.model.WeeklyLeaderboard;
import com.carbon.carbontracker.model.TransactionStatus;
import com.carbon.carbontracker.repository.BadgeRepository;
import com.carbon.carbontracker.repository.GoalRepository;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.repository.TransactionRepository;
import com.carbon.carbontracker.repository.WeeklyLeaderboardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private BadgeRuleService badgeRuleService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private WeeklyLeaderboardRepository weeklyLeaderboardRepository;

    /**
     * Global leaderboard. Score formula (kept in sync with admin UI):
     *   score = (SUM(carbon_offset) on SUCCESS purchases × 50) + (goalsCompleted × 20) + (badgesEarned × 10)
     */
    public List<LeaderboardEntryResponse> getGlobalLeaderboard() {

        List<User> users = userRepository.findAll();

        List<LeaderboardEntryResponse> entries = users.stream()
                .filter(user -> {
                    String role = user.getRole();
                    if (role == null) return true;
                    String r = role.trim().toLowerCase();
                    return !r.contains("admin");
                })
                .map(user -> {
                    long goalsCompleted =
                            goalRepository.countByUser_IdAndStatus(user.getId(), Goal.GoalStatus.COMPLETED);

                    long badgesEarned = badgeRepository.countByUserId(user.getId());

                    BigDecimal sumBd = transactionRepository.sumCarbonOffsetByUser_IdAndStatus(
                            user.getId(), TransactionStatus.SUCCESS);
                    double totalCarbonOffsetPurchased = sumBd != null ? sumBd.doubleValue() : 0.0;

                    double score =
                            (totalCarbonOffsetPurchased * 50.0)
                                    + (goalsCompleted * 20.0)
                                    + (badgesEarned * 10.0);

                    return LeaderboardEntryResponse.builder()
                            .userId(user.getId())
                            .userName(user.getName() != null ? user.getName() : user.getEmail())
                            .totalCarbonOffsetPurchased(totalCarbonOffsetPurchased)
                            .goalsCompleted((int) goalsCompleted)
                            .badgesEarned((int) badgesEarned)
                            .score(score)
                            .build();
                })
                .sorted(Comparator.comparingDouble(LeaderboardEntryResponse::getScore).reversed())
                .collect(Collectors.toList());

        int total = entries.size();
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntryResponse e = entries.get(i);
            int rank = i + 1;
            badgeRuleService.onLeaderboardPosition(e.getUserId(), rank, total);
        }

        try {
            saveWeeklySnapshot(entries);
        } catch (Exception ignored) {
            /* keep live API working if snapshot persistence fails */
        }

        return entries;
    }

    private void saveWeeklySnapshot(List<LeaderboardEntryResponse> entries) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);

        weeklyLeaderboardRepository.deleteByWeekStart(weekStart);

        List<WeeklyLeaderboard> rows = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntryResponse e = entries.get(i);
            rows.add(WeeklyLeaderboard.builder()
                    .weekStart(weekStart)
                    .weekEnd(weekEnd)
                    .userId(e.getUserId())
                    .userName(e.getUserName())
                    .rankPosition(i + 1)
                    .marketplaceCarbonOffset(e.getTotalCarbonOffsetPurchased())
                    .goalsCompleted(e.getGoalsCompleted())
                    .badgesEarned(e.getBadgesEarned())
                    .score(e.getScore())
                    .build());
        }
        weeklyLeaderboardRepository.saveAll(rows);
    }

    public List<LeaderboardEntryResponse> getCurrentWeekLeaderboard() {
        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        return getWeeklyLeaderboardByWeekStart(weekStart);
    }

    public List<LeaderboardEntryResponse> getWeeklyLeaderboardByWeekStart(LocalDate weekStart) {
        if (weekStart == null) {
            weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        }
        List<WeeklyLeaderboard> rows = weeklyLeaderboardRepository.findByWeekStartOrderByRankPositionAsc(weekStart);

        if (rows.isEmpty()) {
            List<LocalDate> availableWeeks = weeklyLeaderboardRepository.findDistinctWeekStartsDesc();
            if (!availableWeeks.isEmpty()) {
                rows = weeklyLeaderboardRepository.findByWeekStartOrderByRankPositionAsc(availableWeeks.get(0));
            }
        }

        return rows
                .stream()
                .map(r -> LeaderboardEntryResponse.builder()
                        .userId(r.getUserId())
                        .userName(r.getUserName())
                        .totalCarbonOffsetPurchased(
                                r.getMarketplaceCarbonOffset() != null ? r.getMarketplaceCarbonOffset() : 0.0)
                        .goalsCompleted(r.getGoalsCompleted() != null ? r.getGoalsCompleted() : 0)
                        .badgesEarned(r.getBadgesEarned() != null ? r.getBadgesEarned() : 0)
                        .score(r.getScore() != null ? r.getScore() : 0.0)
                        .build())
                .collect(Collectors.toList());
    }

    public List<LocalDate> getAvailableWeeklySnapshotStarts() {
        return weeklyLeaderboardRepository.findDistinctWeekStartsDesc();
    }
}
