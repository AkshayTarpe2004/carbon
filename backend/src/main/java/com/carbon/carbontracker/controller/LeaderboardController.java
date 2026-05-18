package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.LeaderboardEntryResponse;
import com.carbon.carbontracker.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryResponse>> getLeaderboard() {
        List<LeaderboardEntryResponse> entries = leaderboardService.getGlobalLeaderboard();
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<LeaderboardEntryResponse>> getWeeklyLeaderboard(
            @RequestParam(value = "weekStart", required = false) String weekStart
    ) {
        LocalDate start = null;
        if (weekStart != null && !weekStart.isBlank()) {
            try {
                start = LocalDate.parse(weekStart.trim());
            } catch (Exception ignored) {
                start = null;
            }
        }
        List<LeaderboardEntryResponse> entries = (start == null)
                ? leaderboardService.getCurrentWeekLeaderboard()
                : leaderboardService.getWeeklyLeaderboardByWeekStart(start);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/weekly/weeks")
    public ResponseEntity<List<LocalDate>> getWeeklySnapshotWeeks() {
        return ResponseEntity.ok(leaderboardService.getAvailableWeeklySnapshotStarts());
    }
}

