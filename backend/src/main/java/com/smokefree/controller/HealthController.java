package com.smokefree.controller;

import com.smokefree.model.HealthMilestone;
import com.smokefree.model.User;
import com.smokefree.repository.HealthMilestoneRepository;
import com.smokefree.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*")
public class HealthController {

    @Autowired
    private HealthMilestoneRepository healthMilestoneRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/milestones")
    public ResponseEntity<?> getMilestones(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        List<HealthMilestone> milestones =
                healthMilestoneRepository.findByUserOrderByHoursRequiredAsc(user);

        // Use minutes for sub-hour precision
        double minutesFree = 0;
        if (user.getQuitDateTime() != null) {
            minutesFree = ChronoUnit.MINUTES.between(
                    user.getQuitDateTime(), LocalDateTime.now());
        }
        final double hoursFree = minutesFree / 60.0;

        List<Map<String, Object>> result = milestones.stream()
                .map(m -> {
                    double hoursRequired = m.getHoursRequired();
                    double hoursRemaining = Math.max(0.0, hoursRequired - hoursFree);
                    // progress percentage 0-100
                    int progressPct = (int) Math.min((hoursFree / hoursRequired) * 100.0, 100);

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id",             m.getId());
                    row.put("milestone",      m.getMilestone());
                    row.put("description",    m.getDescription() != null ? m.getDescription() : "");
                    row.put("hoursRequired",  hoursRequired);
                    row.put("isReached",      m.getIsReached());
                    row.put("reachedAt",      m.getReachedAt() != null ? m.getReachedAt().toString() : "");
                    row.put("hoursRemaining", hoursRemaining);
                    row.put("hoursFree",      Math.floor(hoursFree));
                    row.put("progressPct",    progressPct);
                    return row;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/milestones/next")
    public ResponseEntity<?> getNextMilestone(Authentication auth) {
        User user = userService.findByEmail(auth.getName());

        if (user.getQuitDateTime() == null) {
            return ResponseEntity.ok(Map.of("message", "No quit date set"));
        }

        double minutesFree = ChronoUnit.MINUTES.between(
                user.getQuitDateTime(), LocalDateTime.now());
        double hoursFree = minutesFree / 60.0;

        List<HealthMilestone> unReached =
                healthMilestoneRepository.findByUserAndIsReached(user, false);

        return unReached.stream()
                .filter(m -> m.getHoursRequired() > hoursFree)
                .min((a, b) -> Double.compare(a.getHoursRequired(), b.getHoursRequired()))
                .map(next -> {
                    double hoursRemaining = next.getHoursRequired() - hoursFree;
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("milestone",      next.getMilestone());
                    body.put("hoursRequired",  next.getHoursRequired());
                    body.put("hoursRemaining", hoursRemaining);
                    body.put("daysRemaining",  hoursRemaining / 24.0);
                    return ResponseEntity.ok((Object) body);
                })
                .orElse(ResponseEntity.ok(Map.of("message", "All milestones reached! 🎉")));
    }
}
