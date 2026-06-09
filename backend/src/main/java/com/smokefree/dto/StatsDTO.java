package com.smokefree.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatsDTO {
    private Long daysFree;
    private Long hoursFree;
    private Long cigarettesAvoided;
    private Double moneySaved;
    private Long minutesOfLifeRegained;
    private Integer achievementsUnlocked;
    private Integer totalAchievements;
    private Integer milestonesReached;
    private Integer totalMilestones;
}
