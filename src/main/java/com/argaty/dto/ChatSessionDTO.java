package com.argaty.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionDTO {

    private Long id;
    private String sessionId;
    private String visitorName;
    private String visitorEmail;
    private String visitorPhone;
    private String status; // "waiting", "connected", "closed"
    private String assignedAdminName;
    private Integer queuePosition;
    private LocalDateTime createdAt;
    private LocalDateTime connectedAt;
    private LocalDateTime closedAt;
    private Integer messageCount;
    private long waitingCount; // Tổng số người đang chờ
    private String closeReason;
}
