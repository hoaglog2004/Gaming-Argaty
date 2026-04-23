package com.argaty.service.impl;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.argaty.dto.ChatMessageDTO;
import com.argaty.dto.ChatSessionDTO;
import com.argaty.entity.ChatMessage;
import com.argaty.entity.ChatSession;
import com.argaty.repository.ChatMessageRepository;
import com.argaty.repository.ChatSessionRepository;
import com.argaty.service.ChatService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Override
    public ChatSessionDTO startChat(String visitorName, String visitorEmail, String visitorPhone) {
        String sessionId = UUID.randomUUID().toString();
        
        ChatSession session = ChatSession.builder()
                .sessionId(sessionId)
                .visitorName(visitorName)
                .visitorEmail(visitorEmail)
                .visitorPhone(visitorPhone)
                .status("waiting")
                .queuePosition(0)
                .messageCount(0)
                .build();
        
        ChatSession saved = chatSessionRepository.save(session);
        updateQueuePositions();
        
        log.info("Chat session started: {} - Visitor: {}", sessionId, visitorName);
        return toDTO(saved);
    }

    @Override
    public ChatSessionDTO startChatForUser(String visitorEmail, String visitorName, String visitorPhone) {
        ChatSession existing = chatSessionRepository
                .findFirstByVisitorEmailAndStatusInOrderByCreatedAtDesc(
                        visitorEmail,
                        Arrays.asList("waiting", "connected")
                )
                .orElse(null);

        if (existing != null) {
            log.info("Resumed existing chat session {} for {}", existing.getSessionId(), visitorEmail);
            return toDTO(existing);
        }

        return startChat(visitorName, visitorEmail, visitorPhone);
    }

    @Override
    public ChatMessageDTO sendMessage(String sessionId, String message, String sender) {
        ChatSession session = chatSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found: " + sessionId));

        ChatMessage chatMessage = ChatMessage.builder()
                .visitorId(sessionId)
                .visitorName(session.getVisitorName())
                .visitorEmail(session.getVisitorEmail())
                .message(message)
                .sender(sender)
                .adminId(session.getAssignedAdminId())
                .adminName(session.getAssignedAdminName())
                .status("sent")
                .conversationStatus(session.getStatus())
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(chatMessage);
        
        // Cập nhật số lượng tin nhắn
        session.setMessageCount(session.getMessageCount() + 1);
        session.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(session);

        log.info("Message sent in session {}: {} - {}", sessionId, sender, message.substring(0, Math.min(50, message.length())));
        return toMessageDTO(saved);
    }

    @Override
    public List<ChatMessageDTO> getConversation(String sessionId) {
        List<ChatMessage> messages = chatMessageRepository.findByVisitorIdOrderByCreatedAtAsc(sessionId);
        return messages.stream().map(this::toMessageDTO).collect(Collectors.toList());
    }

    @Override
    public ChatSessionDTO getChatSession(String sessionId) {
        ChatSession session = chatSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found: " + sessionId));
        return toDTO(session);
    }

    @Override
    public ChatSessionDTO assignChatToAdmin(String sessionId, Long adminId, String adminName) {
        ChatSession session = chatSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found: " + sessionId));

        session.setAssignedAdminId(adminId);
        session.setAssignedAdminName(adminName);
        session.setStatus("connected");
        session.setConnectedAt(LocalDateTime.now());
        
        ChatSession updated = chatSessionRepository.save(session);
        
        log.info("Chat {} assigned to admin: {}", sessionId, adminName);
        return toDTO(updated);
    }

    @Override
    public void closeChat(String sessionId, String reason) {
        ChatSession session = chatSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found: " + sessionId));

        session.setStatus("closed");
        session.setClosedAt(LocalDateTime.now());
        session.setCloseReason(reason);
        
        chatSessionRepository.save(session);
        
        log.info("Chat {} closed. Reason: {}", sessionId, reason);
    }

    @Override
    public long getWaitingQueueCount() {
        return chatSessionRepository.countWaitingChats();
    }

    @Override
    public List<ChatSessionDTO> getWaitingQueue() {
        List<ChatSession> waiting = chatSessionRepository.findQueueByStatus("waiting");
        return waiting.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<ChatSessionDTO> getOpenChats() {
        List<ChatSession> chats = chatSessionRepository.findByStatusInOrderByCreatedAtDesc(
                Arrays.asList("waiting", "connected")
        );
        return chats.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<ChatSessionDTO> getAdminActiveChats(Long adminId) {
        List<ChatSession> chats = chatSessionRepository.findByAssignedAdminIdAndStatus(adminId, "connected");
        return chats.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public void markMessageAsRead(Long messageId) {
        chatMessageRepository.findById(messageId).ifPresent(msg -> {
            msg.setIsRead(true);
            msg.setReadAt(LocalDateTime.now());
            msg.setStatus("read");
            chatMessageRepository.save(msg);
        });
    }

    @Override
    public void updateQueuePositions() {
        List<ChatSession> waiting = chatSessionRepository.findQueueByStatus("waiting");
        for (int i = 0; i < waiting.size(); i++) {
            waiting.get(i).setQueuePosition(i + 1);
        }
        chatSessionRepository.saveAll(waiting);
    }

    private ChatSessionDTO toDTO(ChatSession session) {
        long waitingCount = chatSessionRepository.countWaitingChats();
        
        return ChatSessionDTO.builder()
                .id(session.getId())
                .sessionId(session.getSessionId())
                .visitorName(session.getVisitorName())
                .visitorEmail(session.getVisitorEmail())
                .visitorPhone(session.getVisitorPhone())
                .status(session.getStatus())
                .assignedAdminName(session.getAssignedAdminName())
                .queuePosition(session.getQueuePosition())
                .createdAt(session.getCreatedAt())
                .connectedAt(session.getConnectedAt())
                .closedAt(session.getClosedAt())
                .messageCount(session.getMessageCount())
                .waitingCount(waitingCount)
                .closeReason(session.getCloseReason())
                .build();
    }

    private ChatMessageDTO toMessageDTO(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .visitorName(message.getVisitorName())
                .message(message.getMessage())
                .sender(message.getSender())
                .adminName(message.getAdminName())
                .createdAt(message.getCreatedAt())
                .status(message.getStatus())
                .isRead(message.getIsRead())
                .build();
    }
}
