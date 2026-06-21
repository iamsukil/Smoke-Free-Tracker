package com.smokefree.service;

import com.smokefree.dto.ProgressDTO;
import com.smokefree.dto.StatsDTO;
import com.smokefree.model.User;
import com.smokefree.repository.AchievementRepository;
import com.smokefree.repository.HealthMilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class ProgressService {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private HealthMilestoneRepository healthMilestoneRepository;

    public ProgressDTO calculateProgress(User user) {
        if (user.getQuitDateTime() == null) {
            return new ProgressDTO(0L, 0L, 0.0, null,
                    user.getCigsPerDay(), user.getCostPerCigarette());
        }

        // Use full LocalDateTime for precision — "1 completed day" = 24 hours
        // from the exact quit time, NOT midnight-to-midnight.
        // Example: quit at 2026-06-21T14:45 → day 1 starts at 2026-06-22T14:45.
        LocalDateTime quitDateTime = user.getQuitDateTime();
        long hoursElapsed = ChronoUnit.HOURS.between(quitDateTime, LocalDateTime.now());
        if (hoursElapsed < 0) hoursElapsed = 0;

        long completedDays = hoursElapsed / 24;  // whole days only

        int cigsPerDay = user.getCigsPerDay() != null ? user.getCigsPerDay() : 0;
        double costPerCig = user.getCostPerCigarette() != null ? user.getCostPerCigarette() : 0.0;

        // Day-based only — no fractional cigarettes
        long cigarettesAvoided = completedDays * cigsPerDay;
        double moneySaved = cigarettesAvoided * costPerCig;

        return new ProgressDTO(
                completedDays,
                cigarettesAvoided,
                Math.round(moneySaved * 100.0) / 100.0,
                quitDateTime.toLocalDate().toString(),
                cigsPerDay,
                costPerCig
        );
    }

    public StatsDTO calculateStats(User user) {
        ProgressDTO progress = calculateProgress(user);

        // hoursFree for display — derived from completedDays
        long hoursFree = progress.getDaysFree() * 24;

        // Each cigarette takes ~11 minutes off your life (day-based)
        long minutesRegained = progress.getCigarettesAvoided() * 11;

        int unlockedAchievements = achievementRepository
                .findByUserAndIsUnlocked(user, true).size();
        int totalAchievements = achievementRepository.findByUser(user).size();

        int milestonesReached = healthMilestoneRepository
                .findByUserAndIsReached(user, true).size();
        int totalMilestones = healthMilestoneRepository
                .findByUserOrderByHoursRequiredAsc(user).size();

        return new StatsDTO(
                progress.getDaysFree(),
                hoursFree,
                progress.getCigarettesAvoided(),
                progress.getMoneySaved(),
                minutesRegained,
                unlockedAchievements,
                totalAchievements,
                milestonesReached,
                totalMilestones
        );
    }
}
