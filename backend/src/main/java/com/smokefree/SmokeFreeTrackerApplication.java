package com.smokefree;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmokeFreeTrackerApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmokeFreeTrackerApplication.class, args);
    }
}
