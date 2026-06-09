package com.smokefree.service;

import com.smokefree.model.Achievement;
import com.smokefree.model.HealthMilestone;
import com.smokefree.model.User;
import com.smokefree.repository.AchievementRepository;
import com.smokefree.repository.HealthMilestoneRepository;
import com.smokefree.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AchievementService {

    private static final Logger log = LoggerFactory.getLogger(AchievementService.class);

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private HealthMilestoneRepository healthMilestoneRepository;

    @Autowired
    private UserRepository userRepository;

    // Badge definitions: name -> {description, daysRequired}
    private static final Map<String, Object[]> BADGE_DEFINITIONS = Map.of(
        "First Day",      new Object[]{"Survived your first smoke-free day!", 1},
        "One Week",       new Object[]{"A full week without cigarettes!", 7},
        "Two Weeks",      new Object[]{"Two strong weeks smoke-free!", 14},
        "One Month",      new Object[]{"A whole month of clean lungs!", 30},
        "Three Months",   new Object[]{"Quarter year champion!", 90},
        "Six Months",     new Object[]{"Half a year hero!", 180},
        "One Year",       new Object[]{"A full year! You are incredible!", 365},
        "Two Years",      new Object[]{"Two years of freedom!", 730},
        "Five Years",     new Object[]{"Five year legend!", 1825}
    );

    /**
     * 8 canonical health milestones (ordered by hours_required).
     * Uses Double to support 0.33 h (≈ 20 minutes).
     */
    public static final Map<String, Double> MILESTONE_DEFINITIONS;
    static {
        MILESTONE_DEFINITIONS = new LinkedHashMap<>();
        MILESTONE_DEFINITIONS.put("Heart rate and blood pressure return to normal",         0.33);
        MILESTONE_DEFINITIONS.put("Carbon monoxide level in blood drops to normal",         8.0);
        MILESTONE_DEFINITIONS.put("Circulation improves and lung function increases",       48.0);
        MILESTONE_DEFINITIONS.put("Coughing and shortness of breath decrease",             72.0);
        MILESTONE_DEFINITIONS.put("Risk of coronary heart disease is half that of a smoker", 8760.0);
        MILESTONE_DEFINITIONS.put("Stroke risk same as a non-smoker",                      43800.0);
        MILESTONE_DEFINITIONS.put("Lung cancer risk falls to half that of a smoker",       87600.0);
        MILESTONE_DEFINITIONS.put("Coronary heart disease risk same as a non-smoker",      175200.0);
    }

    // ─── Public API ─────────────────────────────────────────────────────────

    /**
     * Called when a new user registers: seed all 9 badges + 8 milestones.
     */
    public void initializeUserData(User user) {
        // Achievements
        for (Map.Entry<String, Object[]> entry : BADGE_DEFINITIONS.entrySet()) {
            if (!achievementRepository.existsByUserAndBadgeName(user, entry.getKey())) {
                Achievement ach = new Achievement();
                ach.setUser(user);
                ach.setBadgeName(entry.getKey());
                ach.setDescription((String) entry.getValue()[0]);
                ach.setDaysRequired((Integer) entry.getValue()[1]);
                ach.setIsUnlocked(false);
                achievementRepository.save(ach);
            }
        }

        // Milestones – use new Double-keyed definitions
        double minutesFree = user.getQuitDate() != null
                ? ChronoUnit.MINUTES.between(user.getQuitDate().atStartOfDay(), LocalDateTime.now())
                : -1;

        for (Map.Entry<String, Double> entry : MILESTONE_DEFINITIONS.entrySet()) {
            if (!healthMilestoneRepository.existsByUserAndMilestone(user, entry.getKey())) {
                HealthMilestone m = new HealthMilestone();
                m.setUser(user);
                m.setMilestone(entry.getKey());
                m.setDescription(entry.getKey());
                m.setHoursRequired(entry.getValue());
                double hoursElapsed = minutesFree / 60.0;
                boolean reached = minutesFree >= 0 && hoursElapsed >= entry.getValue();
                m.setIsReached(reached);
                if (reached) {
                    // back-calculate when milestone was first reached relative to quit date
                    m.setReachedAt(user.getQuitDate().atStartOfDay()
                            .plusMinutes((long) (entry.getValue() * 60)));
                }
                healthMilestoneRepository.save(m);
            }
        }
    }

    public void checkAndUnlockAchievements(User user) {
        if (user.getQuitDate() == null) return;
        long daysFree = ChronoUnit.DAYS.between(user.getQuitDate(), LocalDate.now());
        if (daysFree < 0) return;

        List<Achievement> achievements = achievementRepository.findByUser(user);
        for (Achievement ach : achievements) {
            if (!ach.getIsUnlocked() && ach.getDaysRequired() != null && daysFree >= ach.getDaysRequired()) {
                ach.setIsUnlocked(true);
                ach.setUnlockedAt(LocalDateTime.now());
                achievementRepository.save(ach);
                log.info("Unlocked achievement '{}' for user {}", ach.getBadgeName(), user.getEmail());
            }
        }
    }

    public void checkAndUnlockMilestones(User user) {
        if (user.getQuitDate() == null) return;

        // Use minutes for precision so 0.33-hour (20-min) milestone works correctly
        double minutesFree = ChronoUnit.MINUTES.between(
                user.getQuitDate().atStartOfDay(), LocalDateTime.now());
        double hoursFreeDouble = minutesFree / 60.0;
        if (hoursFreeDouble < 0) return;

        List<HealthMilestone> milestones = healthMilestoneRepository.findByUserOrderByHoursRequiredAsc(user);
        for (HealthMilestone milestone : milestones) {
            if (!milestone.getIsReached() && hoursFreeDouble >= milestone.getHoursRequired()) {
                milestone.setIsReached(true);
                milestone.setReachedAt(LocalDateTime.now());
                healthMilestoneRepository.save(milestone);
                log.info("Milestone '{}' reached for user {}", milestone.getMilestone(), user.getEmail());
            }
        }
    }

    public void checkAllUsers() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            checkAndUnlockAchievements(user);
            checkAndUnlockMilestones(user);
        }
    }
}
