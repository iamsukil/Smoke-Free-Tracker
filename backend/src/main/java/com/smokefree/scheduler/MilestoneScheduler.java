package com.smokefree.scheduler;

import com.smokefree.service.SchedulerService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MilestoneScheduler implements Job {

    private static final Logger log = LoggerFactory.getLogger(MilestoneScheduler.class);

    @Autowired
    private SchedulerService schedulerService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("MilestoneScheduler triggered at: {}", context.getFireTime());
        schedulerService.runMilestoneCheck();
    }
}
