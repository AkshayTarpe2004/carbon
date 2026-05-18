package com.carbon.carbontracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.carbon.carbontracker.model.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    /**
     * Case- and whitespace-insensitive match so duplicates are not missed across DB collations.
     */
    @Query("SELECT u FROM User u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:email))")
    Optional<User> findByEmailNormalized(@Param("email") String email);

    Optional<User> findByResetToken(String resetToken);
}
