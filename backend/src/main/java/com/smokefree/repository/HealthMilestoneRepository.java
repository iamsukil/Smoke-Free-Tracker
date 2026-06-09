package com.smokefree.repository;

import com.smokefree.model.HealthMilestone;
import com.smokefree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HealthMilestoneRepository extends JpaRepository<HealthMilestone, Long> {
    List<HealthMilestone> findByUserOrderByHoursRequiredAsc(User user);
    List<HealthMilestone> findByUserAndIsReached(User user, Boolean isReached);
    Optional<HealthMilestone> findByUserAndMilestone(User user, String milestone);
    boolean existsByUserAndMilestone(User user, String milestone);
}
