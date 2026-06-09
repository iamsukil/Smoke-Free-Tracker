package com.smokefree.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SchedulerService {

    private static final Logger log = LoggerFactory.getLogger(SchedulerService.class);

    @Autowired
    private AchievementService achievementService;

    public void runAchievementCheck() {
        log.info("Running scheduled achievement check for all users...");
        achievementService.checkAllUsers();
        log.info("Achievement check complete.");
    }

    public void runMilestoneCheck() {
        log.info("Running scheduled milestone check for all users...");
        achievementService.checkAllUsers();
        log.info("Milestone check complete.");
    }
}
