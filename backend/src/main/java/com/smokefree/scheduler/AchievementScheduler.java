package com.smokefree.scheduler;

import com.smokefree.service.SchedulerService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.JobDetailFactoryBean;
import org.springframework.scheduling.quartz.SimpleTriggerFactoryBean;
import org.springframework.scheduling.quartz.CronTriggerFactoryBean;
import org.springframework.stereotype.Component;

@Component
public class AchievementScheduler implements Job {

    private static final Logger log = LoggerFactory.getLogger(AchievementScheduler.class);

    @Autowired
    private SchedulerService schedulerService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("AchievementScheduler triggered at: {}", context.getFireTime());
        schedulerService.runAchievementCheck();
    }
}
