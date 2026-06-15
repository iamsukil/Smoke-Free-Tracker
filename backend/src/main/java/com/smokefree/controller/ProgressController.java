package com.smokefree.controller;

import com.smokefree.dto.ProgressDTO;
import com.smokefree.dto.StatsDTO;
import com.smokefree.model.User;
import com.smokefree.service.ProgressService;
import com.smokefree.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProgressController {

    @Autowired
    private ProgressService progressService;

    @Autowired
    private UserService userService;

    @GetMapping("/progress/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        StatsDTO stats = progressService.calculateStats(user);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/progress/basic")
    public ResponseEntity<?> getBasicProgress(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        ProgressDTO progress = progressService.calculateProgress(user);
        return ResponseEntity.ok(progress);
    }

    /**
     * Returns per day/week/month/year breakdowns of cigarettes avoided,
     * money saved, and life time won back.
     */
    @GetMapping("/progress/overall")
    public ResponseEntity<?> getOverallProgress(Authentication auth) {
        User user = userService.findByEmail(auth.getName());

        int cigsPerDay   = user.getCigsPerDay()   != null ? user.getCigsPerDay()   : 0;
        double costPerCig = user.getCostPerCigarette() != null ? user.getCostPerCigarette() : 0.0;
        // 6 minutes of life per cigarette avoided
        long minPerCig = 6;

        // ── Cigarettes avoided ─────────────────────────────────────────
        long cigsWeek  = (long) cigsPerDay * 7;
        long cigsMonth = Math.round(cigsPerDay * 30.44);
        long cigsYear  = (long) cigsPerDay * 365;

        // ── Money saved ────────────────────────────────────────────────
        double monDay   = round2(cigsPerDay  * costPerCig);
        double monWeek  = round2(cigsWeek    * costPerCig);
        double monMonth = round2(cigsMonth   * costPerCig);
        double monYear  = round2(cigsYear    * costPerCig);

        // ── Time won back (minutes → human-readable) ───────────────────
        long minDay   = cigsPerDay * minPerCig;
        long minWeek  = cigsWeek   * minPerCig;
        long minMonth = cigsMonth  * minPerCig;
        long minYear  = cigsYear   * minPerCig;

        Map<String, Object> result = new LinkedHashMap<>();

        // Cigarettes
        result.put("cigsPerDay",   cigsPerDay);
        result.put("cigsPerWeek",  cigsWeek);
        result.put("cigsPerMonth", cigsMonth);
        result.put("cigsPerYear",  cigsYear);

        // Money
        result.put("moneyPerDay",   monDay);
        result.put("moneyPerWeek",  monWeek);
        result.put("moneyPerMonth", monMonth);
        result.put("moneyPerYear",  monYear);

        // Time
        result.put("timePerDay",   fmtMinutes(minDay));
        result.put("timePerWeek",  fmtMinutes(minWeek));
        result.put("timePerMonth", fmtMinutes(minMonth));
        result.put("timePerYear",  fmtMinutes(minYear));

        // Raw minutes (for potential client-side use)
        result.put("rawMinPerDay",   minDay);
        result.put("rawMinPerWeek",  minWeek);
        result.put("rawMinPerMonth", minMonth);
        result.put("rawMinPerYear",  minYear);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/user/quit-date")
    public ResponseEntity<?> updateQuitDate(@RequestBody Map<String, String> body,
                                             Authentication auth) {
        try {
            User user = userService.findByEmail(auth.getName());

            String quitDateStr = body.get("quitDate");   // e.g. "2026-06-15"
            String quitTimeStr = body.getOrDefault("quitTime", "00:00"); // e.g. "15:33" (24-hr)

            // Combine date + time into a single LocalDateTime (no timezone — stored as local wall-clock)
            LocalDate date = LocalDate.parse(quitDateStr);
            LocalTime time = LocalTime.parse(quitTimeStr); // HH:MM or HH:MM:SS
            user.setQuitDateTime(date.atTime(time));

            if (body.containsKey("cigsPerDay")) {
                user.setCigsPerDay(Integer.parseInt(body.get("cigsPerDay")));
            }
            if (body.containsKey("costPerCigarette")) {
                user.setCostPerCigarette(Double.parseDouble(body.get("costPerCigarette")));
            }

            userService.updateUser(user);
            return ResponseEntity.ok(Map.of("message", "Quit date updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        // Return full ISO-8601 datetime string (e.g. "2026-06-15T15:33:00") so the
        // frontend can always restore the exact saved quit time after a page refresh.
        return ResponseEntity.ok(Map.of(
                "name",        user.getName(),
                "email",       user.getEmail(),
                "quitDate",    user.getQuitDateTime() != null ? user.getQuitDateTime().toString() : "",
                "cigsPerDay",  user.getCigsPerDay()   != null ? user.getCigsPerDay()   : 0,
                "costPerCigarette", user.getCostPerCigarette() != null ? user.getCostPerCigarette() : 0.0
        ));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private String fmtMinutes(long totalMinutes) {
        if (totalMinutes == 0) return "0 minutes";
        if (totalMinutes < 60) return totalMinutes + " min";
        long hours = totalMinutes / 60;
        long mins  = totalMinutes % 60;
        if (hours < 24) {
            return hours + " hour" + (hours != 1 ? "s" : "") +
                   (mins > 0 ? " " + mins + " min" : "");
        }
        long days       = hours / 24;
        long remHours   = hours % 24;
        return days + " day" + (days != 1 ? "s" : "") +
               (remHours > 0 ? " " + remHours + " hour" : "");
    }
}
