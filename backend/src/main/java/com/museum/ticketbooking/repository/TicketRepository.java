package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByMuseum_Id(Long museumId);

    List<Ticket> findByMuseum_IdOrderByCreatedAtDesc(Long museumId);

    List<Ticket> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    Optional<Ticket> findByOrderId(String orderId);

    List<Ticket> findByMuseum_IdAndPhoneOrderByCreatedAtDesc(Long museumId, String phone);

    @Query("SELECT t FROM Ticket t WHERE t.museum.id = :museumId AND t.status = :status ORDER BY t.createdAt DESC")
    List<Ticket> findByMuseumIdAndStatus(@Param("museumId") Long museumId, @Param("status") String status);

    @Query(value = "SELECT COUNT(*) FROM tickets t WHERE t.museum_id = :museumId AND CAST(t.created_at AS DATE) = CURRENT_DATE", nativeQuery = true)
    Long countTodayTickets(@Param("museumId") Long museumId);

    @Query(value = "SELECT COALESCE(SUM(t.total_price), 0) FROM tickets t WHERE t.museum_id = :museumId AND CAST(t.created_at AS DATE) = CURRENT_DATE", nativeQuery = true)
    Double getTodayRevenue(@Param("museumId") Long museumId);

    @Query(value = "SELECT * FROM tickets t WHERE t.museum_id = :museumId AND CAST(t.created_at AS DATE) = :date ORDER BY t.created_at DESC", nativeQuery = true)
    List<Ticket> findTodayTicketsByMuseumId(@Param("museumId") Long museumId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.museum.id = :museumId AND t.status = 'ACTIVE'")
    Long countActiveTickets(@Param("museumId") Long museumId);

    List<Ticket> findByMuseum_IdAndCreatedAtAfterOrderByCreatedAtAsc(Long museumId, java.time.LocalDateTime startDate);
}
