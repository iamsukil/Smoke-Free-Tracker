package com.smokefree.service;

import com.smokefree.dto.ProgressDTO;
import com.smokefree.dto.StatsDTO;
import com.smokefree.model.User;
import com.smokefree.repository.AchievementRepository;
import com.smokefree.repository.HealthMilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class ProgressService {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private HealthMilestoneRepository healthMilestoneRepository;

    public ProgressDTO calculateProgress(User user) {
        if (user.getQuitDate() == null) {
            return new ProgressDTO(0L, 0L, 0.0, null,
                    user.getCigsPerDay(), user.getCostPerPack());
        }

        long daysFree = ChronoUnit.DAYS.between(user.getQuitDate(), LocalDate.now());
        if (daysFree < 0) daysFree = 0;

        int cigsPerDay = user.getCigsPerDay() != null ? user.getCigsPerDay() : 0;
        double costPerPack = user.getCostPerPack() != null ? user.getCostPerPack() : 0.0;

        long cigarettesAvoided = daysFree * cigsPerDay;
        // 20 cigarettes per pack
        double moneySaved = (cigarettesAvoided / 20.0) * costPerPack;

        return new ProgressDTO(
                daysFree,
                cigarettesAvoided,
                Math.round(moneySaved * 100.0) / 100.0,
                user.getQuitDate() != null ? user.getQuitDate().toString() : null,
                cigsPerDay,
                costPerPack
        );
    }

    public StatsDTO calculateStats(User user) {
        ProgressDTO progress = calculateProgress(user);

        long hoursFree = progress.getDaysFree() * 24;
        // Each cigarette takes ~11 minutes off your life
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
