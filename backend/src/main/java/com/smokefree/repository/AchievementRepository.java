package com.smokefree.repository;

import com.smokefree.model.Achievement;
import com.smokefree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    List<Achievement> findByUser(User user);
    List<Achievement> findByUserAndIsUnlocked(User user, Boolean isUnlocked);
    Optional<Achievement> findByUserAndBadgeName(User user, String badgeName);
    boolean existsByUserAndBadgeName(User user, String badgeName);
}
