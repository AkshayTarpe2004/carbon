package com.carbon.carbontracker.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_name", nullable = false, length = 255)
    private String senderName;

    @Column(name = "sender_email", nullable = false, length = 255)
    private String senderEmail;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "message_body", nullable = false, columnDefinition = "TEXT")
    private String messageBody;

    /** Admin has handled this thread (e.g. replied or marked read). Nullable for legacy rows until backfilled. */
    @Column(name = "is_read")
    private Boolean readFlag = false;

    /** Email subject line used when an admin last sent a reply (null if never replied). */
    @Column(name = "reply_subject", length = 500)
    private String replySubject;

    /** Admin-authored reply body that was emailed (null if never replied). */
    @Column(name = "reply_body", columnDefinition = "TEXT")
    private String replyBody;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (readFlag == null) {
            readFlag = false;
        }
    }
}
