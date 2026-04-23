package com.argaty.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.argaty.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByVisitorIdOrderByCreatedAtDesc(String visitorId);

    List<ChatMessage> findByVisitorIdOrderByCreatedAtAsc(String visitorId);

    List<ChatMessage> findByVisitorId(String visitorId);

    @Query("SELECT m FROM ChatMessage m WHERE m.visitorId = :visitorId ORDER BY m.createdAt DESC LIMIT :limit")
    List<ChatMessage> findLatestMessagesByVisitorId(@Param("visitorId") String visitorId, @Param("limit") int limit);

    List<ChatMessage> findByAdminIdAndIsReadFalse(Long adminId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.visitorId = :visitorId AND m.sender = 'visitor'")
    long countVisitorMessages(@Param("visitorId") String visitorId);
}
