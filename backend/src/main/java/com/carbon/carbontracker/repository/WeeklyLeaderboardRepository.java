package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.WeeklyLeaderboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface WeeklyLeaderboardRepository extends JpaRepository<WeeklyLeaderboard, Long> {

    void deleteByUserId(Long userId);

    void deleteByWeekStart(LocalDate weekStart);
    List<WeeklyLeaderboard> findByWeekStartOrderByRankPositionAsc(LocalDate weekStart);

    @Query("select distinct w.weekStart from WeeklyLeaderboard w order by w.weekStart desc")
    List<LocalDate> findDistinctWeekStartsDesc();
}
