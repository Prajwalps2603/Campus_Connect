package com.campusconnect.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    private static final Logger logger = LoggerFactory.getLogger(ProjectController.class);

    private final List<Map<String, ?>> projects = new ArrayList<>();

    @PostMapping
    public ResponseEntity<?> uploadProject(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("technology") String technology,
            @RequestParam("completion_percentage") int completionPercentage,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        try {
            if (file != null) {
                logger.info("Received file for project '{}': name={}, size={}", title, file.getOriginalFilename(), file.getSize());
            }

            var entry = Map.of(
                    "title", title,
                    "description", description,
                    "technology", technology,
                    "completion_percentage", completionPercentage,
                    "hasFile", file != null
            );

            projects.add(entry);

            return ResponseEntity.ok(Map.of("success", true, "message", "Project uploaded successfully"));
        } catch (Exception e) {
            logger.error("Error uploading project", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getProjects() {
        return ResponseEntity.ok(Map.of("success", true, "projects", projects));
    }
}
