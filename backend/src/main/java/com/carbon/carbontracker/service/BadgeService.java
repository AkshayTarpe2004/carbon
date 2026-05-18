package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.BadgeRequest;
import com.carbon.carbontracker.dto.BadgeResponse;
import com.carbon.carbontracker.dto.BadgeStatsDTO;
import com.carbon.carbontracker.model.Badge;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.BadgeRepository;
import com.carbon.carbontracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // ---------------------------------------------------------------
    // Award a badge to a user (skips if already awarded)
    // ---------------------------------------------------------------
    public BadgeResponse awardBadge(Long userId, BadgeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Prevent duplicate awards for the same badge name
        if (badgeRepository.existsByUserIdAndBadgeName(userId, request.getBadgeName())) {
            throw new RuntimeException("Badge '" + request.getBadgeName() + "' already awarded to this user");
        }

        Badge badge = Badge.builder()
                .user(user)
                .badgeName(request.getBadgeName())
                .description(request.getDescription())
                .build();

        Badge saved = badgeRepository.save(badge);
        try {
            notificationService.createBadgeNotification(user, saved.getBadgeName());
        } catch (Exception ignored) {
            // Badge award should still succeed even if notification fails.
        }
        return toResponse(saved);
    }

    // ---------------------------------------------------------------
    // Get all badges earned by a user
    // ---------------------------------------------------------------
    public List<BadgeResponse> getBadgesByUser(Long userId) {
        return badgeRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(
                        b -> normalizeBadgeName(b.getBadgeName()),
                        b -> b,
                        BadgeService::pickPreferredDuplicate,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted(Comparator
                        .comparing(Badge::getAwardedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed()
                        .thenComparing(Badge::getId, Comparator.reverseOrder()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private static String normalizeBadgeName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase(Locale.ROOT);
    }

    /** If legacy data has duplicate awards for the same badge name, keep the latest award. */
    private static Badge pickPreferredDuplicate(Badge a, Badge b) {
        LocalDateTime ta = a.getAwardedAt();
        LocalDateTime tb = b.getAwardedAt();
        if (ta == null && tb == null) {
            return a.getId() >= b.getId() ? a : b;
        }
        if (ta == null) {
            return b;
        }
        if (tb == null) {
            return a;
        }
        int cmp = tb.compareTo(ta);
        if (cmp != 0) {
            return cmp > 0 ? b : a;
        }
        return a.getId() >= b.getId() ? a : b;
    }

    // ---------------------------------------------------------------
    // Admin analytics: count badges earned globally by badge name
    // ---------------------------------------------------------------
    public List<BadgeStatsDTO> getBadgeStatsForAdmin() {
        return badgeRepository.findBadgeStatsForAdmin()
                .stream()
                .map(row -> new BadgeStatsDTO(
                        String.valueOf(row[0]),
                        row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L
                ))
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Mapping helper
    // ---------------------------------------------------------------
    private BadgeResponse toResponse(Badge badge) {
        return BadgeResponse.builder()
                .id(badge.getId())
                .userId(badge.getUser().getId())
                .badgeName(badge.getBadgeName())
                .description(badge.getDescription())
                .awardedAt(badge.getAwardedAt())
                .build();
    }
}