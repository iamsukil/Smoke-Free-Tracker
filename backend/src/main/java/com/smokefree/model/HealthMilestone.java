package com.smokefree.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_milestones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "milestone", nullable = false, length = 500)
    private String milestone;

    @Column(name = "description", length = 500)
    private String description;

    /**
     * Changed from Integer to Double to support sub-hour milestones (e.g. 0.33h = 20 min).
     * Hibernate ddl-auto=update will ALTER the column type automatically.
     */
    @Column(name = "hours_required", nullable = false)
    private Double hoursRequired;

    @Column(name = "reached_at")
    private LocalDateTime reachedAt;

    @Column(name = "is_reached")
    private Boolean isReached = false;

    @PrePersist
    public void prePersist() {
        if (this.isReached == null) this.isReached = false;
    }
}
