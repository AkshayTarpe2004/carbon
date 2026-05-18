package com.carbon.carbontracker.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    private LocalDateTime createdAt;

    private String resetToken;
    private LocalDateTime resetTokenExpiry;

    @Builder.Default
    private String role = "USER";

    @Builder.Default
    private boolean active = true;

    // One user → many carbon logs
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<CarbonLog> carbonLogs;

    // One user → many auth tokens
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<AuthToken> authTokens;
}
