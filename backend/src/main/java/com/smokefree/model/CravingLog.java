package com.smokefree.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cravings_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CravingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "intensity", nullable = false)
    private Integer intensity; // 1-10

    @Column(name = "craving_trigger")
    private String trigger;

    @Column(name = "logged_at")
    private LocalDateTime loggedAt;

    @PrePersist
    public void prePersist() {
        this.loggedAt = LocalDateTime.now();
    }
}
