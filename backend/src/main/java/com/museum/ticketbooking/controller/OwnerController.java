package com.museum.ticketbooking.controller;

import com.museum.ticketbooking.dto.OwnerMuseumProfileDTO;
import com.museum.ticketbooking.model.MuseumImage;
import com.museum.ticketbooking.model.ReviewResponse;
import com.museum.ticketbooking.service.AnalyticsService;
import com.museum.ticketbooking.service.ImageUploadService;
import com.museum.ticketbooking.service.OwnerProfileService;
import com.museum.ticketbooking.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/owner/museums/me")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OwnerController {

    private final OwnerProfileService profileService;
    private final ImageUploadService imageUploadService;
    private final ReviewService reviewService;
    private final AnalyticsService analyticsService;

    public OwnerController(OwnerProfileService profileService,
                           ImageUploadService imageUploadService,
                           ReviewService reviewService,
                           AnalyticsService analyticsService) {
        this.profileService = profileService;
        this.imageUploadService = imageUploadService;
        this.reviewService = reviewService;
        this.analyticsService = analyticsService;
    }

    private Long getMuseumId(HttpServletRequest request) {
        String idStr = (String) request.getAttribute("museumId");
        if (idStr == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Unauthorized"
            );
        }
        return Long.parseLong(idStr);
    }

    @GetMapping("/profile")
    public ResponseEntity<OwnerMuseumProfileDTO> getProfile(HttpServletRequest request) {
        return ResponseEntity.ok(profileService.getOwnerProfile(getMuseumId(request)));
    }

    @PutMapping("/profile")
    public ResponseEntity<OwnerMuseumProfileDTO> updateProfile(HttpServletRequest request,
                                                               @RequestBody OwnerMuseumProfileDTO dto) {
        return ResponseEntity.ok(profileService.updateOwnerProfile(getMuseumId(request), dto));
    }

    @PostMapping("/images")
    public ResponseEntity<MuseumImage> uploadImage(HttpServletRequest request,
                                                   @RequestParam("file") MultipartFile file,
                                                   @RequestParam("imageType") String imageType,
                                                   @RequestParam(value = "caption", required = false) String caption) {
        return ResponseEntity.ok(imageUploadService.uploadImage(getMuseumId(request), file, imageType, caption));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteImage(HttpServletRequest request, @PathVariable Long imageId) {
        imageUploadService.deleteImage(imageId, getMuseumId(request));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/reviews/{reviewId}/response")
    public ResponseEntity<ReviewResponse> respondToReview(HttpServletRequest request,
                                                          @PathVariable Long reviewId,
                                                          @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(reviewService.addResponse(reviewId, getMuseumId(request), payload.get("responseText")));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(HttpServletRequest request, 
                                                            @RequestParam(defaultValue = "30d", required = false) String range) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(getMuseumId(request), range));
    }
}
