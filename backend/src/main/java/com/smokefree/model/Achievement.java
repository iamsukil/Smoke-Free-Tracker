package com.smokefree.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "achievements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_name", nullable = false)
    private String badgeName;

    @Column(name = "description")
    private String description;

    @Column(name = "days_required")
    private Integer daysRequired;

    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt;

    @Column(name = "is_unlocked")
    private Boolean isUnlocked = false;

    @PrePersist
    public void prePersist() {
        if (this.isUnlocked == null) this.isUnlocked = false;
    }
}
