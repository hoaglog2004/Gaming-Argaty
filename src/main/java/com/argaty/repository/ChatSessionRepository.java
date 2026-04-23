package com.argaty.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.argaty.entity.ChatSession;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    Optional<ChatSession> findBySessionId(String sessionId);

    List<ChatSession> findByStatusOrderByCreatedAtAsc(String status);

    List<ChatSession> findByAssignedAdminId(Long adminId);

    List<ChatSession> findByAssignedAdminIdAndStatus(Long adminId, String status);

        Optional<ChatSession> findFirstByVisitorEmailAndStatusInOrderByCreatedAtDesc(
            String visitorEmail,
            Collection<String> statuses
        );

        List<ChatSession> findByStatusInOrderByCreatedAtDesc(Collection<String> statuses);

    @Query("SELECT cs FROM ChatSession cs WHERE cs.status = :status ORDER BY cs.createdAt ASC")
    List<ChatSession> findQueueByStatus(@Param("status") String status);

    @Query("SELECT COUNT(cs) FROM ChatSession cs WHERE cs.status = 'waiting'")
    long countWaitingChats();

    @Query("SELECT COUNT(cs) FROM ChatSession cs WHERE cs.assignedAdminId = :adminId AND cs.status = 'connected'")
    long countActiveChatsForAdmin(@Param("adminId") Long adminId);
}
