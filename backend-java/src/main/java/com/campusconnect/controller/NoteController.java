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
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NoteController {

    private static final Logger logger = LoggerFactory.getLogger(NoteController.class);

    // Simple in-memory store for quick testing; replace with DB/service wiring
    private final List<Map<String, ?>> notes = new ArrayList<>();

    @PostMapping
    public ResponseEntity<?> uploadNote(
            @RequestParam("title") String title,
            @RequestParam("subject") String subject,
            @RequestParam("course_code") String courseCode,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        try {
            if (file != null) {
                logger.info("Received file for note '{}': name={}, size={}", title, file.getOriginalFilename(), file.getSize());
                // In a real app save to disk or object storage and record path in DB
            }

            var entry = Map.of(
                    "title", title,
                    "subject", subject,
                    "course_code", courseCode,
                    "content", content,
                    "hasFile", file != null
            );

            notes.add(entry);

            return ResponseEntity.ok(Map.of("success", true, "message", "Note uploaded successfully"));
        } catch (Exception e) {
            logger.error("Error uploading note", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getNotes() {
        return ResponseEntity.ok(Map.of("success", true, "notes", notes));
    }
}
