package com.carbon.carbontracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.carbon.carbontracker.model.AuthToken;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    void deleteByUser_Id(Long userId);

    Optional<AuthToken> findByRefreshToken(String refreshToken);
}
