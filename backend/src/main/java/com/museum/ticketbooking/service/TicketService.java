package com.museum.ticketbooking.service;

import com.museum.ticketbooking.dto.TicketBookingRequest;
import com.museum.ticketbooking.dto.VerificationRequest;
import com.museum.ticketbooking.model.Museum;
import com.museum.ticketbooking.model.Ticket;
import com.museum.ticketbooking.repository.MuseumRepository;
import com.museum.ticketbooking.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final MuseumRepository museumRepository;

    public TicketService(TicketRepository ticketRepository, MuseumRepository museumRepository) {
        this.ticketRepository = ticketRepository;
        this.museumRepository = museumRepository;
    }

    /* ── CREATE TICKET (called by chatbot after collecting email + phone) ── */
    @Transactional
    public Map<String, Object> createTicket(TicketBookingRequest request) {
        Museum museum = museumRepository.findById(request.getMuseumId())
                .orElseThrow(() -> new RuntimeException("Museum not found"));

        if (!Boolean.TRUE.equals(museum.getBookingStatus())) {
            throw new RuntimeException("Bookings are currently closed for this museum");
        }

        // Check seat limit (basic guard)
        if (museum.getSeatLimit() != null && museum.getSeatLimit() <= 0) {
            throw new RuntimeException("No seats available for today");
        }

        int adults   = request.getAdults()   == null ? 0 : request.getAdults();
        int children = request.getChildren() == null ? 0 : request.getChildren();

        if (adults + children <= 0) {
            throw new RuntimeException("At least one adult or child must be selected");
        }

        double adultPrice = museum.getAdultPrice() == null ? 0 : museum.getAdultPrice();
        double childPrice = museum.getChildPrice() == null ? 0 : museum.getChildPrice();
        double total      = (adults * adultPrice) + (children * childPrice);

        Ticket ticket = new Ticket();
        ticket.setMuseum(museum);
        ticket.setUserEmail(request.getEmail().trim().toLowerCase());
        ticket.setPhone(request.getPhone().trim());
        ticket.setAdults(adults);
        ticket.setChildren(children);
        ticket.setTotalPrice(total);
        ticket.setStatus("PENDING");

        Ticket saved = ticketRepository.save(ticket);

        Map<String, Object> result = new HashMap<>();
        result.put("id",           saved.getId());
        result.put("ticketId",     saved.getId());
        result.put("ticketNumber", saved.getTicketNumber());
        result.put("totalPrice",   saved.getTotalPrice());
        result.put("museumName",   museum.getMuseumName());
        result.put("status",       saved.getStatus());
        result.put("adults",       adults);
        result.put("children",     children);
        return result;
    }

    /* ── SAVE PAYMENT ORDER ID ── */
    @Transactional
    public void savePaymentOrder(Long ticketId, String orderId) {
        Ticket ticket = getTicketById(ticketId);
        if (!"PENDING".equalsIgnoreCase(ticket.getStatus())) {
            throw new RuntimeException("Only PENDING ticket can receive a payment order");
        }
        ticket.setOrderId(orderId);
        ticketRepository.save(ticket);
    }

    /* ── ACTIVATE TICKET AFTER PAYMENT ── */
    @Transactional
    public void activateTicketPayment(Long ticketId, String paymentId, String orderId) {
        Ticket ticket = getTicketById(ticketId);
        if ("ACTIVE".equalsIgnoreCase(ticket.getStatus()))    return;
        if ("USED".equalsIgnoreCase(ticket.getStatus()))       throw new RuntimeException("Used ticket cannot be activated again");
        if ("CANCELLED".equalsIgnoreCase(ticket.getStatus())) throw new RuntimeException("Cancelled ticket cannot be activated");

        ticket.setPaymentId(paymentId);
        ticket.setOrderId(orderId);
        ticket.setStatus("ACTIVE");
        ticketRepository.save(ticket);
    }

    /* ── VERIFY TICKET (staff enters permanent museum PIN) ── */
    @Transactional
    public boolean verifyTicket(VerificationRequest request) {
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getMuseum() == null || !ticket.getMuseum().getId().equals(request.getMuseumId())) {
            throw new RuntimeException("Ticket does not belong to this museum");
        }

        if (!"ACTIVE".equalsIgnoreCase(ticket.getStatus())) {
            throw new RuntimeException("Ticket is not active. Status: " + ticket.getStatus());
        }

        // Validate against the museum's permanent staffPin
        String storedPin    = ticket.getMuseum().getStaffPin();
        String submittedPin = request.getStaffPin();

        if (storedPin == null || submittedPin == null || !storedPin.equals(submittedPin.trim())) {
            throw new RuntimeException("Invalid 4-digit museum code. Please ask staff for the correct code.");
        }

        ticket.setStatus("USED");
        ticket.setUsedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        return true;
    }

    /* ── HELPERS ── */
    public Ticket getTicketByOrderId(String orderId) {
        return ticketRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Ticket not found for order ID"));
    }

    public List<Ticket> getUserTickets(String email) {
        return ticketRepository.findByUserEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
    }

    public List<Ticket> getMuseumTickets(Long museumId) {
        return ticketRepository.findByMuseum_IdOrderByCreatedAtDesc(museumId);
    }

    public List<Ticket> getTicketsByPhone(Long museumId, String phone) {
        return ticketRepository.findByMuseum_IdAndPhoneOrderByCreatedAtDesc(museumId, phone.trim());
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    public Ticket getTicketByNumber(String ticketNumber) {
        return ticketRepository.findByTicketNumber(ticketNumber.trim())
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    @Transactional
    public Ticket cancelTicket(Long id) {
        Ticket ticket = getTicketById(id);
        if (!"ACTIVE".equalsIgnoreCase(ticket.getStatus()) && !"PENDING".equalsIgnoreCase(ticket.getStatus())) {
            throw new RuntimeException("Cannot cancel ticket with status: " + ticket.getStatus());
        }
        ticket.setStatus("CANCELLED");
        return ticketRepository.save(ticket);
    }

    public List<Ticket> getTodayTickets(Long museumId) {
        return ticketRepository.findTodayTicketsByMuseumId(museumId, LocalDate.now());
    }

    @Transactional
    public void updateTicketPayment(Long ticketId, String paymentId, String orderId) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setPaymentId(paymentId);
        ticket.setOrderId(orderId);
        ticket.setStatus("ACTIVE");
        ticketRepository.save(ticket);
    }
}
