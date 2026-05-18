package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.Transaction;
import com.carbon.carbontracker.model.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    void deleteByUser_Id(Long userId);

    List<Transaction> findByUserId(Long userId);

    Optional<Transaction> findByIdAndUser_Id(Long id, Long userId);

    /** Pending rows at or before {@code cutoff} (e.g. now minus 24h) for timeout expiry. */
    List<Transaction> findByStatusAndCreatedAtLessThanEqual(TransactionStatus status, LocalDateTime cutoff);
    List<Transaction> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.user LEFT JOIN FETCH t.marketplaceItem ORDER BY t.createdAt DESC")
    List<Transaction> findAllWithUserAndItemOrderByCreatedAtDesc();
    List<Transaction> findByUserIdAndMarketplaceItem_ItemNameContainingIgnoreCase(Long userId, String keyword);

    @Query("SELECT COALESCE(SUM(t.carbonOffset), 0) FROM Transaction t WHERE t.user.id = :userId AND t.status = :status")
    BigDecimal sumCarbonOffsetByUser_IdAndStatus(@Param("userId") Long userId, @Param("status") TransactionStatus status);
}