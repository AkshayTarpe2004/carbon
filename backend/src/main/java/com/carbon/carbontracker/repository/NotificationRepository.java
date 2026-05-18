package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    void deleteByUser_Id(Long userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdOrUserIsNullOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsRead(Long userId, Boolean isRead);
    long countByUserIdAndIsRead(Long userId, Boolean isRead);
}