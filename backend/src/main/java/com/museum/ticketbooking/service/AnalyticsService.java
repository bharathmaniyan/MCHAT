package com.museum.ticketbooking.service;

import com.museum.ticketbooking.model.Museum;
import com.museum.ticketbooking.model.Ticket;
import com.museum.ticketbooking.repository.MuseumRepository;
import com.museum.ticketbooking.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    
    private final TicketRepository ticketRepository;
    private final MuseumRepository museumRepository;

    public AnalyticsService(TicketRepository ticketRepository, MuseumRepository museumRepository) {
        this.ticketRepository = ticketRepository;
        this.museumRepository = museumRepository;
    }
    
    public Map<String, Object> getDashboardStats(Long museumId, String range) {
        Map<String, Object> stats = new HashMap<>();
        
        // Static today stats
        Long todayTickets = ticketRepository.countTodayTickets(museumId);
        Double todayRevenue = ticketRepository.getTodayRevenue(museumId);
        Long activeBookings = ticketRepository.countActiveTickets(museumId);
        
        stats.put("todayTicketsCount", todayTickets != null ? todayTickets : 0L);
        stats.put("todayRevenue", todayRevenue != null ? todayRevenue : 0.0);
        stats.put("activeBookingsCount", activeBookings != null ? activeBookings : 0L);
        
        // Determine start date based on range
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusDays(30); // Default 30D
        
        if (range != null) {
            switch (range.toLowerCase()) {
                case "30d": startDate = now.minusDays(30); break;
                case "6m": startDate = now.minusMonths(6); break;
                case "1y": startDate = now.minusYears(1); break;
                case "3y": startDate = now.minusYears(3); break;
                case "5y": startDate = now.minusYears(5); break;
                case "all": startDate = now.minusYears(100); break;
            }
        }
        
        // Fetch tickets in range
        List<Ticket> ticketsInRange = ticketRepository.findByMuseum_IdAndCreatedAtAfterOrderByCreatedAtAsc(museumId, startDate);
        
        // Group tickets by date
        Map<LocalDate, Double> revenueMap = new LinkedHashMap<>();
        Map<LocalDate, Long> ticketsMap = new LinkedHashMap<>();
        
        long totalVisitorsInRange = 0L;
        
        for (Ticket t : ticketsInRange) {
            LocalDate date = t.getCreatedAt().toLocalDate();
            Double price = t.getTotalPrice() != null ? t.getTotalPrice() : 0.0;
            Long visitors = (long) ((t.getAdults() != null ? t.getAdults() : 0) + (t.getChildren() != null ? t.getChildren() : 0));
            
            revenueMap.put(date, revenueMap.getOrDefault(date, 0.0) + price);
            ticketsMap.put(date, ticketsMap.getOrDefault(date, 0L) + visitors);
            
            totalVisitorsInRange += visitors;
        }
        
        // Prepare arrays for Recharts
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd");
        List<Map<String, Object>> dailyRevenue = new ArrayList<>();
        List<Map<String, Object>> dailyTickets = new ArrayList<>();
        
        // Sort keys just in case
        List<LocalDate> sortedDates = new ArrayList<>(revenueMap.keySet());
        Collections.sort(sortedDates);
        
        for (LocalDate d : sortedDates) {
            String dateStr = d.format(dtf);
            
            Map<String, Object> revItem = new HashMap<>();
            revItem.put("date", dateStr);
            revItem.put("revenue", Math.round(revenueMap.get(d) * 100.0) / 100.0);
            dailyRevenue.add(revItem);
            
            Map<String, Object> tickItem = new HashMap<>();
            tickItem.put("date", dateStr);
            tickItem.put("tickets", ticketsMap.get(d));
            dailyTickets.add(tickItem);
        }
        
        // Profile Views: Since no historical tracking exists, we use the total or a scaled mock metric. 
        // We'll return the total public view count from the Museum model.
        Long profileViewsInRange = 0L;
        Optional<Museum> museumOpt = museumRepository.findById(museumId);
        if (museumOpt.isPresent() && museumOpt.get().getPublicViewCount() != null) {
            profileViewsInRange = museumOpt.get().getPublicViewCount();
        }
        
        stats.put("totalVisitorsRange", totalVisitorsInRange);
        stats.put("profileViewsRange", profileViewsInRange);
        stats.put("dailyRevenue", dailyRevenue);
        stats.put("dailyTickets", dailyTickets);
        
        return stats;
    }
}
