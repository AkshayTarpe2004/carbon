package com.carbon.carbontracker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactMessageResponse {

    private Long id;
    private String name;
    private String email;
    private String subject;
    private String message;
    private LocalDateTime createdAt;
    /** True once an admin has replied or marked the message read. JSON key stays {@code read}. */
    @JsonProperty("read")
    private Boolean messageRead;

    /** Set when an admin sent a reply email (same values shown in the reply form). */
    private String replySubject;

    private String replyBody;
}
