package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.ContactMessageRequest;
import com.carbon.carbontracker.dto.ContactMessageResponse;
import com.carbon.carbontracker.dto.ContactReplyRequest;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.ContactMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageService contactMessageService;
    private final UserRepository userRepository;

    /** Public: marketing site contact form. */
    @PostMapping("/messages")
    public ResponseEntity<ContactMessageResponse> submitMessage(@RequestBody ContactMessageRequest request) {
        ContactMessageResponse saved = contactMessageService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Admin only: list all contact submissions (newest first). */
    @GetMapping("/messages/admin")
    public ResponseEntity<List<ContactMessageResponse>> listForAdmin() {
        requireAdmin();
        return ResponseEntity.ok(contactMessageService.findAllForAdmin());
    }

    /** Admin only: send a reply email to the original sender; marks the thread as read. */
    @PostMapping("/messages/{id}/reply")
    public ResponseEntity<ContactMessageResponse> replyToMessage(
            @PathVariable Long id,
            @RequestBody ContactReplyRequest request) {
        User admin = requireAdmin();
        return ResponseEntity.ok(contactMessageService.replyAsAdmin(id, request, admin));
    }

    /** Admin only: mark a contact message as read without sending mail. */
    @PatchMapping("/messages/{id}/read")
    public ResponseEntity<ContactMessageResponse> markMessageRead(@PathVariable Long id) {
        requireAdmin();
        return ResponseEntity.ok(contactMessageService.markReadByAdmin(id));
    }

    private User requireAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        if (!AdminAuditLogService.isAdminRole(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can perform this action");
        }
        return user;
    }
}
