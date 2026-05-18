package com.carbon.carbontracker.service;

import com.carbon.carbontracker.repository.AuthTokenRepository;
import com.carbon.carbontracker.repository.BadgeRepository;
import com.carbon.carbontracker.repository.CarbonLogRepository;
import com.carbon.carbontracker.repository.GoalRepository;
import com.carbon.carbontracker.repository.NotificationRepository;
import com.carbon.carbontracker.repository.SurveyRepository;
import com.carbon.carbontracker.repository.TransactionRepository;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.repository.WeeklyLeaderboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hard-deletes a user and dependent rows so DELETE succeeds regardless of DB FK cascade rules.
 */
@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final NotificationRepository notificationRepository;
    private final GoalRepository goalRepository;
    private final BadgeRepository badgeRepository;
    private final CarbonLogRepository carbonLogRepository;
    private final SurveyRepository surveyRepository;
    private final TransactionRepository transactionRepository;
    private final AuthTokenRepository authTokenRepository;
    private final WeeklyLeaderboardRepository weeklyLeaderboardRepository;
    private final UserRepository userRepository;

    @Transactional
    public void deleteUserAndRelatedData(Long userId) {
        notificationRepository.deleteByUser_Id(userId);
        goalRepository.deleteByUser_Id(userId);
        badgeRepository.deleteByUser_Id(userId);
        carbonLogRepository.deleteByUser_Id(userId);
        surveyRepository.deleteByUser_Id(userId);
        transactionRepository.deleteByUser_Id(userId);
        authTokenRepository.deleteByUser_Id(userId);
        weeklyLeaderboardRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }
}
