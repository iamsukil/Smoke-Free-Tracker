package com.smokefree.config;

import com.smokefree.scheduler.AchievementScheduler;
import com.smokefree.scheduler.MilestoneScheduler;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    // ===== Achievement Job: Daily at midnight =====
    @Bean
    public JobDetail achievementJobDetail() {
        return JobBuilder.newJob(AchievementScheduler.class)
                .withIdentity("achievementJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger achievementTrigger(JobDetail achievementJobDetail) {
        return TriggerBuilder.newTrigger()
                .forJob(achievementJobDetail)
                .withIdentity("achievementTrigger")
                .withSchedule(CronScheduleBuilder.dailyAtHourAndMinute(0, 0))
                .build();
    }

    // ===== Milestone Job: Every 20 minutes =====
    @Bean
    public JobDetail milestoneJobDetail() {
        return JobBuilder.newJob(MilestoneScheduler.class)
                .withIdentity("milestoneJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger milestoneTrigger(JobDetail milestoneJobDetail) {
        return TriggerBuilder.newTrigger()
                .forJob(milestoneJobDetail)
                .withIdentity("milestoneTrigger")
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInMinutes(20)
                        .repeatForever())
                .build();
    }
}
