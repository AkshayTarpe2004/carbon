
package com.carbon.carbontracker.controller;

import com.carbon.carbontracker.dto.GoalRequest;
import com.carbon.carbontracker.dto.GoalResponse;
import com.carbon.carbontracker.model.Goal.GoalStatus;
import com.carbon.carbontracker.model.User;
import com.carbon.carbontracker.repository.UserRepository;
import com.carbon.carbontracker.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    @Autowired
    private GoalService goalService;

    @Autowired
    private UserRepository userRepository;

    // ------------------------------------------------------------------
    // Helper — resolve the currently authenticated user's ID from JWT
    // ------------------------------------------------------------------
    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmailNormalized(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        return user.getId();
    }

    // POST /api/goals — create a new goal
    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@RequestBody GoalRequest request) {
        Long userId = getCurrentUserId();
        GoalResponse response = goalService.createGoal(userId, request);
        return ResponseEntity.ok(response);
    }

    // GET /api/goals — list all goals for the current user
    // Optional query param: ?status=ACTIVE or ?status=COMPLETED
    @GetMapping
    public ResponseEntity<List<GoalResponse>> getGoals(
            @RequestParam(required = false) GoalStatus status) {
        Long userId = getCurrentUserId();
        List<GoalResponse> goals = (status != null)
                ? goalService.getGoalsByUserAndStatus(userId, status)
                : goalService.getGoalsByUser(userId);
        return ResponseEntity.ok(goals);
    }

    // GET /api/goals/admin — list all non-admin user goals (for admin dashboard)
    @GetMapping("/admin")
    public ResponseEntity<List<GoalResponse>> getAllNonAdminGoals() {
        List<GoalResponse> goals = goalService.getAllNonAdminGoals();
        return ResponseEntity.ok(goals);
    }

    // PUT /api/goals/{id} — update a goal (only owner can update)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGoal(@PathVariable Long id,
            @RequestBody GoalRequest request) {
        Long userId = getCurrentUserId();
        try {
            GoalResponse response = goalService.updateGoal(id, userId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/goals/{id} — delete a goal (only owner can delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGoal(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        try {
            goalService.deleteGoal(id, userId);
            return ResponseEntity.ok("Goal deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
