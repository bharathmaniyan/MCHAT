package com.museum.ticketbooking.controller;

import com.museum.ticketbooking.service.SseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/owner/realtime")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OwnerRealtimeController {

    private final SseService sseService;

    public OwnerRealtimeController(SseService sseService) {
        this.sseService = sseService;
    }

    @GetMapping("/stream")
    public SseEmitter stream(HttpServletRequest request) {
        String idStr = (String) request.getAttribute("museumId");
        if (idStr == null) throw new RuntimeException("Unauthorized");
        Long museumId = Long.parseLong(idStr);
        
        return sseService.subscribe(museumId);
    }
}
