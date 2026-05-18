package com.carbon.carbontracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import com.carbon.carbontracker.model.CarbonLog;
import com.carbon.carbontracker.model.User;

// ✅ ADD THESE IMPORTS
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

@Repository
public interface CarbonLogRepository extends JpaRepository<CarbonLog, Long> {

    void deleteByUser_Id(Long userId);

    Optional<CarbonLog> findByUserAndDate(User user, LocalDate date);

    Optional<CarbonLog> findByIdAndUser(Long id, User user);

    List<CarbonLog> findByUserAndDateBetween(
            User user,
            LocalDate startDate,
            LocalDate endDate
    );

    List<CarbonLog> findByUser(User user);

    Optional<CarbonLog> findFirstByUser_IdOrderByDateDesc(Long userId);

    // ✅ ADD THIS METHOD
   @Query("SELECT SUM(c.totalEmission) FROM CarbonLog c WHERE c.user.id = :userId AND c.date BETWEEN :startDate AND :endDate")
BigDecimal sumEmissionsByUserAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
);
}