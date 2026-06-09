package com.smokefree.controller;

import com.smokefree.model.CravingLog;
import com.smokefree.model.User;
import com.smokefree.repository.CravingRepository;
import com.smokefree.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cravings")
@CrossOrigin(origins = "*")
public class CravingController {

    @Autowired
    private CravingRepository cravingRepository;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> logCraving(@RequestBody Map<String, Object> body,
                                         Authentication auth) {
        try {
            User user = userService.findByEmail(auth.getName());

            int intensity = Integer.parseInt(body.get("intensity").toString());
            if (intensity < 1 || intensity > 10) {
                return ResponseEntity.badRequest().body(Map.of("error", "Intensity must be 1-10"));
            }

            String trigger = body.containsKey("trigger") ? body.get("trigger").toString() : "Unknown";

            CravingLog log = new CravingLog();
            log.setUser(user);
            log.setIntensity(intensity);
            log.setTrigger(trigger);

            CravingLog saved = cravingRepository.save(log);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", saved.getId(),
                    "intensity", saved.getIntensity(),
                    "trigger", saved.getTrigger(),
                    "loggedAt", saved.getLoggedAt().toString(),
                    "message", "Craving logged. You're stronger than this!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getCravingHistory(Authentication auth) {
        User user = userService.findByEmail(auth.getName());

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<CravingLog> logs = cravingRepository
                .findByUserAndLoggedAtAfterOrderByLoggedAtAsc(user, sevenDaysAgo);

        // Group by day: label -> average intensity
        Map<String, List<Integer>> byDay = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");

        for (CravingLog cl : logs) {
            String day = cl.getLoggedAt().format(fmt);
            byDay.computeIfAbsent(day, k -> new java.util.ArrayList<>()).add(cl.getIntensity());
        }

        Map<String, Object> chartData = new LinkedHashMap<>();
        List<String> labels = new java.util.ArrayList<>(byDay.keySet());
        List<Double> avgIntensities = labels.stream()
                .map(l -> byDay.get(l).stream().mapToInt(i -> i).average().orElse(0.0))
                .toList();
        List<Integer> counts = labels.stream()
                .map(l -> byDay.get(l).size())
                .toList();

        chartData.put("labels", labels);
        chartData.put("avgIntensities", avgIntensities);
        chartData.put("counts", counts);
        chartData.put("totalCravings", logs.size());

        // Also include recent logs
        List<Map<String, Object>> recentLogs = logs.stream()
                .sorted((a, b) -> b.getLoggedAt().compareTo(a.getLoggedAt()))
                .limit(10)
                .map(cl -> Map.of(
                        "id", (Object) cl.getId(),
                        "intensity", cl.getIntensity(),
                        "trigger", cl.getTrigger() != null ? cl.getTrigger() : "Unknown",
                        "loggedAt", cl.getLoggedAt().toString()
                ))
                .toList();

        chartData.put("recentLogs", recentLogs);

        return ResponseEntity.ok(chartData);
    }
}
