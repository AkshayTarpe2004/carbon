package com.carbon.carbontracker.util;

public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    /** At least one letter, one digit, one special char from @$!%*#?& */
    private static final String PATTERN = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{" + MIN_LENGTH + ",}$";

    public static final String REQUIREMENT_MSG = "Invalid password.";

    public static boolean isValid(String password) {
        if (password == null || password.isBlank()) return false;
        return password.matches(PATTERN);
    }
}
