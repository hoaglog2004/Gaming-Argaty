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
public class ChatMessageDTO {

    private Long id;
    private String visitorName;
    private String message;
    private String sender; // "visitor" hoặc "admin"
    private String adminName;
    private LocalDateTime createdAt;
    private String status; // "sent", "delivered", "read"
    private Boolean isRead;
}
