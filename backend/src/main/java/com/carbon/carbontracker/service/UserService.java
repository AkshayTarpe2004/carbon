package com.carbon.carbontracker.service;

import com.carbon.carbontracker.dto.OtpResult;
import com.carbon.carbontracker.dto.RegisterRequest;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.util.PasswordValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final Random RANDOM = new Random();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    private static final int REGISTRATION_VERIFIED_MINUTES = 15;

    private static final class RegistrationOtpEntry {
        final String otp;
        final LocalDateTime expiresAt;

        RegistrationOtpEntry(String otp, LocalDateTime expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }

    private final ConcurrentHashMap<String, RegistrationOtpEntry> registrationOtpByEmail = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime> registrationVerifiedUntil = new ConcurrentHashMap<>();

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Local part @ domain with at least one dot in domain (practical format check before OTP). */
    private static final Pattern REGISTRATION_EMAIL_PATTERN =
            Pattern.compile("^[\\w.%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$");

    private static boolean isValidRegistrationEmail(String email) {
        return email != null && REGISTRATION_EMAIL_PATTERN.matcher(email).matches();
    }

    public record RegistrationOtpSendOutcome(boolean success, String message) {}

    public record RegistrationOtpVerifyOutcome(boolean success, String message) {}

    /**
     * Start email registration: rejects if email is taken; sends OTP by email only (no log/dev fallback).
     * OTP is stored only after the message is accepted for delivery by the mail provider.
     */
    public RegistrationOtpSendOutcome requestRegistrationOtp(String emailRaw) {
        String email = normalizeEmail(emailRaw);
        if (email.isBlank() || !isValidRegistrationEmail(email)) {
            return new RegistrationOtpSendOutcome(false, "Please enter a valid email address.");
        }
        if (userRepository.findByEmailNormalized(email).isPresent()) {
            return new RegistrationOtpSendOutcome(false,
                    "This email is already present. Log in or use a different email address.");
        }
        int otp = 100000 + RANDOM.nextInt(900000);
        String otpStr = String.valueOf(otp);

        boolean emailSent = emailService.sendRegistrationOtpEmail(email, otpStr);
        if (!emailSent) {
            log.warn("Registration OTP not issued for {}: email could not be sent (configure SMTP or try again).", email);
            return new RegistrationOtpSendOutcome(false,
                    "We could not send the verification email. Check that outgoing mail is configured and try again.");
        }

        registrationOtpByEmail.put(email, new RegistrationOtpEntry(otpStr, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        registrationVerifiedUntil.remove(email);
        return new RegistrationOtpSendOutcome(true,
                "A 6-digit code has been sent to your email. It is valid for 10 minutes.");
    }

    /**
     * Validates OTP and marks the email as eligible to complete registration for a short window.
     */
    public RegistrationOtpVerifyOutcome verifyRegistrationOtp(String emailRaw, String otpRaw) {
        String email = normalizeEmail(emailRaw);
        if (email.isBlank()) {
            return new RegistrationOtpVerifyOutcome(false, "Please enter a valid email address.");
        }
        if (otpRaw == null || otpRaw.isBlank()) {
            return new RegistrationOtpVerifyOutcome(false, "Enter the verification code we sent you.");
        }
        if (userRepository.findByEmailNormalized(email).isPresent()) {
            registrationOtpByEmail.remove(email);
            return new RegistrationOtpVerifyOutcome(false,
                    "This email is already present. Log in or use a different email address.");
        }
        RegistrationOtpEntry entry = registrationOtpByEmail.get(email);
        if (entry == null) {
            return new RegistrationOtpVerifyOutcome(false, "Invalid or expired code. Request a new code.");
        }
        if (entry.expiresAt.isBefore(LocalDateTime.now())) {
            registrationOtpByEmail.remove(email);
            return new RegistrationOtpVerifyOutcome(false, "Invalid or expired code. Request a new code.");
        }
        if (!entry.otp.equals(otpRaw.trim())) {
            return new RegistrationOtpVerifyOutcome(false, "That code is incorrect. Try again or request a new code.");
        }
        registrationOtpByEmail.remove(email);
        registrationVerifiedUntil.put(email, LocalDateTime.now().plusMinutes(REGISTRATION_VERIFIED_MINUTES));
        return new RegistrationOtpVerifyOutcome(true, "Email verified.");
    }

    private boolean isRegistrationEmailVerified(String email) {
        String key = normalizeEmail(email);
        LocalDateTime until = registrationVerifiedUntil.get(key);
        return until != null && until.isAfter(LocalDateTime.now());
    }

    private void clearRegistrationVerification(String email) {
        registrationVerifiedUntil.remove(normalizeEmail(email));
    }

    public Optional<User> getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmailNormalized(email.trim());
    }

    public boolean updateUserProfile(String email, String name, String newEmail, String password) {

    Optional<User> userOpt = userRepository.findByEmail(email);

    if (userOpt.isEmpty()) {
        return false;
    }

    User user = userOpt.get();

    user.setName(name);
    user.setEmail(newEmail);

    if (password != null && !password.isBlank()) {
        user.setPassword(passwordEncoder.encode(password));
    }

    userRepository.save(user);

    return true;
    }

    public String registerUser(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!isRegistrationEmailVerified(email)) {
            return "Please verify your email with the code we sent before completing sign-up.";
        }
        if (!PasswordValidator.isValid(request.getPassword())) {
            return PasswordValidator.REQUIREMENT_MSG;
        }
        if (userRepository.findByEmailNormalized(email).isPresent()) {
            return "This email is already present. Log in or use a different email address.";
        }

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        clearRegistrationVerification(email);

        return "User registered successfully!";
    }
    public boolean validateUser(String email, String password) {

    User user = userRepository.findByEmailNormalized(email.trim())
            .orElse(null);

    if (user == null) {
        return false;
    }

    return passwordEncoder.matches(password, user.getPassword());
}

    /**
     * Request password reset: generates a 6-digit OTP, saves it with 10-minute expiry,
     * and sends it by email if mail is configured. Returns OtpResult when user exists
     * (emailSent=true and otp=null when sent by email; emailSent=false and otp set when not sent, for dev).
     */
    public Optional<OtpResult> requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        User user = userOpt.get();
        int otp = 100000 + RANDOM.nextInt(900000);
        String otpStr = String.valueOf(otp);
        user.setResetToken(otpStr);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        userRepository.save(user);

        boolean emailSent = emailService.sendOtpEmail(email, otpStr);
        if (emailSent) {
            return Optional.of(new OtpResult(true, null));
        }
        return Optional.of(new OtpResult(false, otpStr));
    }

    /**
     * Reset password using email and OTP. Returns true if successful.
     */
   public boolean resetPasswordWithOtp(String email, String otp, String newPassword) {

    Optional<User> userOpt = userRepository.findByEmail(email);
    if (userOpt.isEmpty()) {
        return false;
    }

    User user = userOpt.get();

    // 1️⃣ Check if OTP exists
    if (user.getResetToken() == null) {
        return false;
    }

    // 2️⃣ Check if OTP matches
    if (!user.getResetToken().equals(otp)) {
        return false;
    }

    // 3️⃣ Check expiry
    if (user.getResetTokenExpiry() == null ||
        user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
        return false;
    }

    // 4️⃣ Encode and save new password
    user.setPassword(passwordEncoder.encode(newPassword));

    // 5️⃣ Clear OTP after successful reset
    user.setResetToken(null);
    user.setResetTokenExpiry(null);

    userRepository.save(user);

    return true;
}
}
