package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.service.AdminAuditLogService;
import com.carbon.carbontracker.service.UserDeletionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AdminAuditLogService adminAuditLogService;
    private final UserDeletionService userDeletionService;

    // Basic list of users for admin tooling (e.g. badge assignment UI)
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/me")
    public User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmailNormalized(email).orElseThrow();
    }

    @PutMapping("/{id}/block")
    public User blockUser(@PathVariable Long id, HttpServletRequest request) {
        User user = userRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setActive(false);
        User saved = userRepository.save(user);
        adminAuditLogService.log(
                "User Blocked",
                (saved.getName() != null ? saved.getName() + " • " : "")
                        + (saved.getEmail() != null ? saved.getEmail() : "id " + id),
                request);
        return saved;
    }

    @PutMapping("/{id}/unblock")
    public User unblockUser(@PathVariable Long id, HttpServletRequest request) {
        User user = userRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setActive(true);
        User saved = userRepository.save(user);
        adminAuditLogService.log(
                "User Unblocked",
                (saved.getName() != null ? saved.getName() + " • " : "")
                        + (saved.getEmail() != null ? saved.getEmail() : "id " + id),
                request);
        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        User actor = userRepository
                .findByEmailNormalized(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        if (!AdminAuditLogService.isAdminRole(actor.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can delete users.");
        }
        if (actor.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account from this screen.");
        }
        User target = userRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (AdminAuditLogService.isAdminRole(target.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be deleted here.");
        }
        String details = (target.getName() != null ? target.getName() + " • " : "")
                + (target.getEmail() != null ? target.getEmail() : "id " + id);
        userDeletionService.deleteUserAndRelatedData(id);
        adminAuditLogService.log("User Deleted", details, request);
    }
}