package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OtpResult {
    private final boolean emailSent;
    private final String otp;
}
