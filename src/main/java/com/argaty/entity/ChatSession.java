package com.argaty.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.UpdateTimestamp;

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
@Table(name = "chat_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sessionId; // Session ID hoặc user ID

    @Nationalized
    @Column(nullable = false)
    private String visitorName;

    @Column
    private String visitorEmail;

    @Column
    private String visitorPhone;

    @Column(nullable = false)
    @Builder.Default
    private String status = "waiting"; // "waiting", "connected", "closed"

    @Column
    private Long assignedAdminId; // Admin ID khi được assign

    @Nationalized
    @Column
    private String assignedAdminName;

    @Column
    @Builder.Default
    private Integer queuePosition = 0; // Vị trí trong hàng đợi

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime connectedAt; // Thời điểm khi được admin tiếp nhận

    @Column
    private LocalDateTime closedAt; // Thời điểm kết thúc chat

    @Column(nullable = false)
    @Builder.Default
    private Integer messageCount = 0; // Số tin nhắn trong phiên

    @Nationalized
    @Column
    private String closeReason; // Lý do kết thúc chat
}
