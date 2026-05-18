package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.AdminAuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    @Query("SELECT a FROM AdminAuditLog a ORDER BY a.createdAt DESC")
    List<AdminAuditLog> findRecent(Pageable pageable);
}
