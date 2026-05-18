package com.carbon.carbontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactReplyRequest {

    /** Required. Shown as the email subject line. */
    private String subject;

    /** Required. Plain-text body sent to the original sender. */
    private String message;
}
