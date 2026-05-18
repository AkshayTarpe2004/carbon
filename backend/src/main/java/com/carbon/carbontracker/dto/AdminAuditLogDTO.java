package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogDTO {
    private Long id;
    private String createdAt;
    private String adminName;
    private String action;
    private String details;
    private String ipAddress;
}
