
package com.carbon.carbontracker.repository;

import com.carbon.carbontracker.model.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    void deleteByUser_Id(Long userId);

    List<Badge> findByUserId(Long userId);

    long countByUserId(Long userId);

    boolean existsByUserIdAndBadgeName(Long userId, String badgeName);

    @Query("""
            select b.badgeName, count(b.id)
            from Badge b
            where b.user is not null
              and (b.user.role is null or lower(b.user.role) not like '%admin%')
            group by b.badgeName
            order by count(b.id) desc
            """)
    List<Object[]> findBadgeStatsForAdmin();
}
