package com.argaty.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import org.hibernate.annotations.Nationalized;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String visitorId; // Session ID hoặc user ID

    @Nationalized
    @Column(nullable = false)
    private String visitorName;

    @Column
    private String visitorEmail;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private String sender = "visitor"; // "visitor" hoặc "admin"

    @Column
    private Long adminId; // ID của admin nếu là tin nhắn từ admin

    @Nationalized
    @Column
    private String adminName; // Tên admin

    @Column
    private Boolean isRead;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime readAt;

    @Column(nullable = false)
    @Builder.Default
    private String status = "sent"; // "sent", "delivered", "read"

    @Column(nullable = false)
    @Builder.Default
    private String conversationStatus = "active"; // "active", "waiting", "closed"
}
