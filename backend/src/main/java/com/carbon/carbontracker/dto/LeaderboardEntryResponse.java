package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryResponse {

    private Long userId;
    private String userName;

    /** Sum of carbon_offset on successful marketplace purchases (SUCCESS), same units as transactions. */
    private double totalCarbonOffsetPurchased;
    private int goalsCompleted;
    private int badgesEarned;

    private double score;
}

