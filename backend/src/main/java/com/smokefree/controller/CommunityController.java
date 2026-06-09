package com.smokefree.controller;

import com.smokefree.model.CommunityPost;
import com.smokefree.model.User;
import com.smokefree.repository.CommunityPostRepository;
import com.smokefree.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/community")
@CrossOrigin(origins = "*")
public class CommunityController {

    @Autowired
    private CommunityPostRepository communityPostRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CommunityPost> posts = communityPostRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<Map<String, Object>> result = posts.getContent().stream()
                .map(p -> Map.of(
                        "id", (Object) p.getId(),
                        "authorName", p.getUser().getName(),
                        "content", p.getContent(),
                        "likes", p.getLikes(),
                        "createdAt", p.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "posts", result,
                "totalPages", posts.getTotalPages(),
                "totalElements", posts.getTotalElements(),
                "currentPage", page
        ));
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody Map<String, String> body,
                                         Authentication auth) {
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content cannot be empty"));
        }
        if (content.length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content too long (max 1000 chars)"));
        }

        User user = userService.findByEmail(auth.getName());
        CommunityPost post = new CommunityPost();
        post.setUser(user);
        post.setContent(content.trim());
        post.setLikes(0);

        CommunityPost saved = communityPostRepository.save(post);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "content", saved.getContent(),
                "likes", saved.getLikes(),
                "createdAt", saved.getCreatedAt().toString(),
                "message", "Post created successfully"
        ));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable Long id, Authentication auth) {
        return communityPostRepository.findById(id)
                .map(post -> {
                    post.setLikes(post.getLikes() + 1);
                    communityPostRepository.save(post);
                    return ResponseEntity.ok((Object) Map.of(
                            "likes", post.getLikes(),
                            "message", "Post liked!"
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Post not found")));
    }
}
