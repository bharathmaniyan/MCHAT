package com.museum.ticketbooking.repository;

import com.museum.ticketbooking.model.MuseumBusinessHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MuseumBusinessHoursRepository extends JpaRepository<MuseumBusinessHours, Long> {
    List<MuseumBusinessHours> findByMuseumIdOrderByDayOfWeekAsc(Long museumId);
    void deleteByMuseumId(Long museumId);
}
