package com.smokefree.config;

import com.smokefree.model.HealthMilestone;
import com.smokefree.model.User;
import com.smokefree.repository.HealthMilestoneRepository;
import com.smokefree.repository.UserRepository;
import com.smokefree.service.AchievementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Runs once on application startup.
 * Ensures all existing users have exactly the 8 canonical health milestones,
 * replacing any old milestone set with the new one.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HealthMilestoneRepository healthMilestoneRepository;

    @Override
    public void run(ApplicationArguments args) {
        log.info("DataInitializer: syncing health milestones for all existing users...");
        List<User> users = userRepository.findAll();

        for (User user : users) {
            reseedMilestones(user);
        }

        log.info("DataInitializer: milestone sync complete for {} user(s).", users.size());
    }

    private void reseedMilestones(User user) {
        // Delete stale milestone rows (old names or old Integer-typed rows)
        List<HealthMilestone> existing = healthMilestoneRepository.findByUserOrderByHoursRequiredAsc(user);
        boolean hasAllNew = existing.stream()
                .map(HealthMilestone::getMilestone)
                .collect(java.util.stream.Collectors.toSet())
                .containsAll(AchievementService.MILESTONE_DEFINITIONS.keySet());

        if (hasAllNew && existing.size() == AchievementService.MILESTONE_DEFINITIONS.size()) {
            // Already seeded correctly — just re-run reach checks
            recalculateReached(user, existing);
            return;
        }

        // Wipe and re-create
        healthMilestoneRepository.deleteAll(existing);

        double minutesFree = user.getQuitDateTime() != null
                ? ChronoUnit.MINUTES.between(user.getQuitDateTime(), LocalDateTime.now())
                : -1;

        for (Map.Entry<String, Double> entry : AchievementService.MILESTONE_DEFINITIONS.entrySet()) {
            HealthMilestone m = new HealthMilestone();
            m.setUser(user);
            m.setMilestone(entry.getKey());
            m.setDescription(entry.getKey());
            m.setHoursRequired(entry.getValue());

            double hoursElapsed = minutesFree / 60.0;
            boolean reached = minutesFree >= 0 && hoursElapsed >= entry.getValue();
            m.setIsReached(reached);
            if (reached) {
                m.setReachedAt(user.getQuitDateTime()
                        .plusMinutes((long) (entry.getValue() * 60)));
            }
            healthMilestoneRepository.save(m);
        }

        log.info("DataInitializer: reseeded 8 milestones for user '{}'", user.getEmail());
    }

    private void recalculateReached(User user, List<HealthMilestone> milestones) {
        if (user.getQuitDateTime() == null) return;
        double minutesFree = ChronoUnit.MINUTES.between(
                user.getQuitDateTime(), LocalDateTime.now());
        double hoursElapsed = minutesFree / 60.0;

        for (HealthMilestone m : milestones) {
            if (!m.getIsReached() && hoursElapsed >= m.getHoursRequired()) {
                m.setIsReached(true);
                m.setReachedAt(user.getQuitDateTime()
                        .plusMinutes((long) (m.getHoursRequired() * 60)));
                healthMilestoneRepository.save(m);
            }
        }
    }
}
