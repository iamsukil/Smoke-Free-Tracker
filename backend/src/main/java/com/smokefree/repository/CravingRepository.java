package com.smokefree.repository;

import com.smokefree.model.CravingLog;
import com.smokefree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CravingRepository extends JpaRepository<CravingLog, Long> {
    List<CravingLog> findByUserAndLoggedAtAfterOrderByLoggedAtAsc(User user, LocalDateTime after);
    List<CravingLog> findByUserOrderByLoggedAtDesc(User user);
}
