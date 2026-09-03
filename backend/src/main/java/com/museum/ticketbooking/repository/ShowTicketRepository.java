package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.ShowTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowTicketRepository extends JpaRepository<ShowTicket, Long> {
    List<ShowTicket> findByUserEmail(String userEmail);
    List<ShowTicket> findByShowId(Long showId);
    Optional<ShowTicket> findByTicketNumber(String ticketNumber);
    
    @Query("SELECT COUNT(st) FROM ShowTicket st WHERE st.show.id = :showId AND st.status = 'ACTIVE'")
    Integer countActiveTicketsForShow(@Param("showId") Long showId);
    
    @Query("SELECT COALESCE(SUM(st.totalPrice), 0) FROM ShowTicket st WHERE st.show.id = :showId")
    Double getTotalRevenueForShow(@Param("showId") Long showId);
}
