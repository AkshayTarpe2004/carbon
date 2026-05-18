package com.carbon.carbontracker.dto;

import lombok.Data;

@Data
public class NotificationDTO {
        private Long userId;   // ✅ ADD THIS

    private String title;
    private String message;
    private String type;
}