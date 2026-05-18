package com.carbon.carbontracker.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "carbon_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private BigDecimal transportEmission;
    private BigDecimal foodEmission;
    private BigDecimal energyEmission;
    private BigDecimal totalEmission;

    // Snapshot of lifestyle survey choices that produced this log
    // Transport
    private String transportMode;      // CAR, BIKE, PUBLIC, WALK, WFH
    private Double distancePerDay;
    private String fuelType;           // PETROL, DIESEL, ELECTRIC, HYBRID

    // Food
    private String dietType;           // VEG, NON_VEG, VEGAN
    private Integer mealsPerDay;
    private String eatingOutFrequency; // RARELY, WEEKLY, OFTEN, DAILY

    // Energy
    private Double monthlyElectricity;
    private Boolean renewable;

    // Many logs → one user
    // Many logs → one user
@JsonIgnoreProperties({"carbonLogs", "authTokens", "password"})
@ManyToOne
@JoinColumn(name = "user_id")
private User user;
}
