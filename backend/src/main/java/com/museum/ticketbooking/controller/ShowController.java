package com.museum.ticketbooking.controller;

import com.museum.ticketbooking.dto.ApiResponse;
import com.museum.ticketbooking.dto.ShowBookingRequest;
import com.museum.ticketbooking.dto.ShowCreationDTO;
import com.museum.ticketbooking.model.Show;
import com.museum.ticketbooking.model.ShowTicket;
import com.museum.ticketbooking.service.ShowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shows")
@CrossOrigin(origins = "http://localhost:5173")
public class ShowController {
    
    private final ShowService showService;
    
    public ShowController(ShowService showService) {
        this.showService = showService;
    }
    
    @PostMapping("/museum/{museumId}")
    public ResponseEntity<ApiResponse<Show>> createShow(
            @PathVariable Long museumId,
            @Valid @RequestBody ShowCreationDTO showDTO) {
        try {
            Show createdShow = showService.createShow(museumId, showDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Show created successfully", createdShow));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/museum/{museumId}")
    public ResponseEntity<ApiResponse<List<Show>>> getMuseumShows(@PathVariable Long museumId) {
        try {
            List<Show> shows = showService.getMuseumShows(museumId);
            return ResponseEntity.ok(ApiResponse.success("Shows retrieved successfully", shows));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/museum/{museumId}/active")
    public ResponseEntity<ApiResponse<List<Show>>> getActiveShows(@PathVariable Long museumId) {
        try {
            List<Show> shows = showService.getActiveShows(museumId);
            return ResponseEntity.ok(ApiResponse.success("Active shows retrieved", shows));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/museum/{museumId}/upcoming")
    public ResponseEntity<ApiResponse<List<Show>>> getUpcomingShows(@PathVariable Long museumId) {
        try {
            List<Show> shows = showService.getUpcomingShows(museumId);
            return ResponseEntity.ok(ApiResponse.success("Upcoming shows retrieved", shows));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/book")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bookShowTicket(
            @Valid @RequestBody ShowBookingRequest request) {
        try {
            Map<String, Object> result = showService.bookShowTicket(request);
            return ResponseEntity.ok(ApiResponse.success("Show ticket booked successfully", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{showId}")
    public ResponseEntity<ApiResponse<Show>> updateShow(
            @PathVariable Long showId,
            @Valid @RequestBody Show show) {
        try {
            Show updatedShow = showService.updateShow(showId, show);
            return ResponseEntity.ok(ApiResponse.success("Show updated successfully", updatedShow));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{showId}")
    public ResponseEntity<ApiResponse<Void>> deleteShow(@PathVariable Long showId) {
        try {
            showService.deleteShow(showId);
            return ResponseEntity.ok(ApiResponse.success("Show deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{showId}")
    public ResponseEntity<ApiResponse<Show>> getShowById(@PathVariable Long showId) {
        try {
            Show show = showService.getShowById(showId);
            return ResponseEntity.ok(ApiResponse.success("Show found", show));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/tickets/user/{email}")
    public ResponseEntity<ApiResponse<List<ShowTicket>>> getUserShowTickets(@PathVariable String email) {
        try {
            List<ShowTicket> tickets = showService.getUserShowTickets(email);
            return ResponseEntity.ok(ApiResponse.success("Show tickets retrieved", tickets));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{showId}/tickets")
    public ResponseEntity<ApiResponse<List<ShowTicket>>> getShowTickets(@PathVariable Long showId) {
        try {
            List<ShowTicket> tickets = showService.getShowTickets(showId);
            return ResponseEntity.ok(ApiResponse.success("Show tickets retrieved", tickets));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/tickets/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyShowTicket(
            @RequestBody Map<String, Object> request) {
        try {
            Long ticketId = Long.parseLong(request.get("ticketId").toString());
            String verificationCode = request.get("verificationCode").toString();
            
            boolean verified = showService.verifyShowTicket(ticketId, verificationCode);
            
            Map<String, Object> data = new HashMap<>();
            data.put("verified", verified);
            data.put("ticketId", ticketId);
            
            return ResponseEntity.ok(ApiResponse.success(
                verified ? "Show ticket verified successfully" : "Show ticket verification failed",
                data
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
