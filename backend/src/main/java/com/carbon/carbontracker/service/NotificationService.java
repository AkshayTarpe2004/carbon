package com.carbon.carbontracker.service;

import com.carbon.carbontracker.model.Notification;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.model.MarketplaceItem;
import com.carbon.carbontracker.repository.NotificationRepository;
import com.carbon.carbontracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    /** Keep in sync with {@link Notification} column lengths and DB schema. */
    private static final int TITLE_MAX = 500;
    private static final int MESSAGE_MAX = 2000;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private static String clip(String s, int maxLen) {
        if (s == null) {
            return "";
        }
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }

    /** Clip {@code body} so that {@code body + suffix} fits in {@link #MESSAGE_MAX} (suffix never truncated). */
    private static String clipMessageKeepingSuffix(String body, String suffix) {
        String suf = suffix != null ? suffix : "";
        int maxBody = MESSAGE_MAX - suf.length();
        if (maxBody < 0) {
            maxBody = 0;
        }
        return clip(body, maxBody) + suf;
    }

    private String getCurrentActor() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmailNormalized(email).orElse(null);
            if (user == null) {
                return email;
            }
            return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();
        } catch (Exception ex) {
            return "System";
        }
    }

    // USER: Get user notifications
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrUserIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> n.getHiddenForUser() == null || !n.getHiddenForUser())
                .toList();
    }

    // USER: Mark as read
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    // USER: Dismiss/hide in UI without deleting (admin still sees it)
    public Notification hideForUser(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setHiddenForUser(true);
        return notificationRepository.save(notification);
    }

    // ADMIN: Create notification (targeted or broadcast).
    // If userId is null, a single global/broadcast notification is created (user field null),
    // which is then visible to all users via getUserNotifications (includes userId OR null).
    public Notification createNotification(Long userId, String title, String message, String type, String clientIp) {
        Notification notification = new Notification();
        if (userId != null) {
            User user = new User();
            user.setId(userId);
            notification.setUser(user);
        }
        notification.setTitle(clip(title, TITLE_MAX));
        notification.setMessage(clip(message, MESSAGE_MAX));
        notification.setType(type);
        notification.setIsRead(false);
        notification.setHiddenForUser(false);
        notification.setAdminName(clip(getCurrentActor(), 255));
        notification.setIpAddress(clip(clientIp != null ? clientIp : "N/A", 255));
        return notificationRepository.save(notification);
    }

    /** System/user-triggered notifications (no HTTP client IP). */
    public Notification createNotification(Long userId, String title, String message, String type) {
        return createNotification(userId, title, message, type, null);
    }

    // ADMIN: Edit notification
    public Notification updateNotification(Long id, String title, String message, String clientIp) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setTitle(clip(title, TITLE_MAX));
        notification.setMessage(clip(message, MESSAGE_MAX));
        notification.setAdminName(clip(getCurrentActor(), 255));
        notification.setIpAddress(clip(clientIp != null ? clientIp : "N/A", 255));
        return notificationRepository.save(notification);
    }

    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    // ADMIN: Delete notification
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    // ADMIN: Get all notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // --- Integration / Auto-trigger Methods ---

    public void createPurchaseNotification(User user, MarketplaceItem item) {
        String title = "Marketplace purchase completed 🛒";
        String message = "You purchased \"" + item.getItemName() + "\" for ₹" + item.getPrice() + ".";
        createNotification(user.getId(), title, message, "PURCHASE");
    }

    /**
     * Reminder for a {@link com.carbon.carbontracker.model.TransactionStatus#PENDING} order.
     * Message ends with {@code [[tx:ID]]} (stripped in the notifications UI; optional for deep links).
     */
    public void createPendingPaymentNotification(User user, MarketplaceItem item, Long transactionId) {
        String title = "Payment pending ⏳";
        String suffix = " [[tx:" + transactionId + "]]";
        String body = "Complete payment for \"" + item.getItemName() + "\" (₹" + item.getPrice()
                + "). Use Confirm payment on the Transactions page.";
        String message = clipMessageKeepingSuffix(body, suffix);
        createNotification(user.getId(), title, message, "PURCHASE_PENDING");
    }

    public void createGoalCompletionNotification(User user, String goalName) {
        createNotification(user.getId(),
            "Goal Completed 🎯",
            "Congratulations! You completed your goal: " + goalName,
            "GOAL");
    }

    public void createBadgeNotification(User user, String badgeName) {
        createNotification(user.getId(),
            "Badge Earned 🏅",
            "You earned the \"" + badgeName + "\" badge! Keep up the great work.",
            "BADGE");
    }

    public void createLeaderboardNotification(User user, int newRank) {
        createNotification(user.getId(),
            "Leaderboard Update 🏆",
            "Your leaderboard rank has improved! You are now ranked #" + newRank,
            "LEADERBOARD");
    }

    public void createHighEmissionNotification(User user, double increasePercent) {
        createNotification(user.getId(),
            "High Emission Alert ⚠️",
            "Your weekly emissions increased by " + (int) increasePercent + "%. Consider reducing transport usage.",
            "EMISSION");
    }
}