package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.ContactMessageRequest;
import com.carbon.carbontracker.dto.ContactMessageResponse;
import com.carbon.carbontracker.dto.ContactReplyRequest;
import com.carbon.carbontracker.model.ContactMessage;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactMessageService {

    private static final int MAX_NAME = 255;
    private static final int MAX_EMAIL = 255;
    private static final int MAX_SUBJECT = 500;
    private static final int MAX_MESSAGE = 8000;
    private static final int MAX_REPLY_SUBJECT = 500;
    private static final int MAX_REPLY_BODY = 12000;

    private final ContactMessageRepository contactMessageRepository;
    private final EmailService emailService;

    public ContactMessageResponse create(ContactMessageRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String name = trimToNull(req.getName());
        String email = trimToNull(req.getEmail());
        String message = trimToNull(req.getMessage());
        if (name == null || email == null || message == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email, and message are required");
        }
        if (name.length() > MAX_NAME || email.length() > MAX_EMAIL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name or email is too long");
        }
        if (!email.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address");
        }
        if (message.length() > MAX_MESSAGE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is too long");
        }
        String subject = trimToNull(req.getSubject());
        if (subject == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required");
        }
        if (subject.length() > MAX_SUBJECT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is too long");
        }

        ContactMessage saved = contactMessageRepository.save(ContactMessage.builder()
                .senderName(name)
                .senderEmail(email)
                .subject(subject)
                .messageBody(message)
                .readFlag(false)
                .build());

        return toResponse(saved);
    }

    public List<ContactMessageResponse> findAllForAdmin() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactMessageResponse replyAsAdmin(Long id, ContactReplyRequest req, User admin) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String subj = trimToNull(req.getSubject());
        String body = trimToNull(req.getMessage());
        if (subj == null || body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject and message are required");
        }
        if (subj.length() > MAX_REPLY_SUBJECT || body.length() > MAX_REPLY_BODY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject or message is too long");
        }

        ContactMessage m = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact message not found"));

        String to = m.getSenderEmail() != null ? m.getSenderEmail().trim() : "";
        if (to.isEmpty() || !to.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Original message has no valid sender email");
        }

        String adminLabel = admin.getName() != null && !admin.getName().isBlank()
                ? admin.getName().trim()
                : admin.getEmail();
        String emailBody = "Hello " + (m.getSenderName() != null ? m.getSenderName().trim() : "") + ",\n\n"
                + body
                + "\n\n---\n"
                + "CarbonCalc support\n"
                + "(This reply was sent by an administrator: " + adminLabel + ")\n";

        boolean sent = emailService.sendPlainTextEmail(to, subj, emailBody);
        if (!sent) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email could not be sent. Check that mail is enabled and configured (app.mail.enabled, spring.mail.*).");
        }

        m.setReadFlag(true);
        m.setReplySubject(subj);
        m.setReplyBody(body);
        ContactMessage saved = contactMessageRepository.save(m);
        return toResponse(saved);
    }

    @Transactional
    public ContactMessageResponse markReadByAdmin(Long id) {
        ContactMessage m = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact message not found"));
        m.setReadFlag(true);
        return toResponse(contactMessageRepository.save(m));
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private ContactMessageResponse toResponse(ContactMessage m) {
        return ContactMessageResponse.builder()
                .id(m.getId())
                .name(m.getSenderName())
                .email(m.getSenderEmail())
                .subject(m.getSubject())
                .message(m.getMessageBody())
                .createdAt(m.getCreatedAt())
                .messageRead(Boolean.TRUE.equals(m.getReadFlag()))
                .replySubject(m.getReplySubject())
                .replyBody(m.getReplyBody())
                .build();
    }
}
