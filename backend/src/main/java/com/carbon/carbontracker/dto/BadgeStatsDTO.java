package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BadgeStatsDTO {
    private String badgeName;
    private Long usersEarned;
}
