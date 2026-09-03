package com.museum.ticketbooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TicketBookingApplication {
    public static void main(String[] args) {
        SpringApplication.run(TicketBookingApplication.class, args);
        System.out.println("\n🚀 Museum Ticket Booking System Started!");
        System.out.println("📝 API Base URL: http://localhost:8080/api");
        System.out.println("📱 Frontend URL: http://localhost:5173\n");
    }
}
