package com.smokefree.controller;

import com.smokefree.model.Achievement;
import com.smokefree.model.User;
import com.smokefree.repository.AchievementRepository;
import com.smokefree.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/achievements")
@CrossOrigin(origins = "*")
public class AchievementController {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> getAchievements(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        List<Achievement> achievements = achievementRepository.findByUser(user);

        List<Map<String, Object>> result = achievements.stream()
                .sorted((a, b) -> Integer.compare(
                        a.getDaysRequired() != null ? a.getDaysRequired() : 0,
                        b.getDaysRequired() != null ? b.getDaysRequired() : 0))
                .map(a -> Map.of(
                        "id", (Object) a.getId(),
                        "badgeName", a.getBadgeName(),
                        "description", a.getDescription() != null ? a.getDescription() : "",
                        "daysRequired", a.getDaysRequired() != null ? a.getDaysRequired() : 0,
                        "isUnlocked", a.getIsUnlocked(),
                        "unlockedAt", a.getUnlockedAt() != null ? a.getUnlockedAt().toString() : ""
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
