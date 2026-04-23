package com.argaty.service;

import java.util.List;

import com.argaty.dto.ChatMessageDTO;
import com.argaty.dto.ChatSessionDTO;

public interface ChatService {

    ChatSessionDTO startChat(String visitorName, String visitorEmail, String visitorPhone);

    ChatSessionDTO startChatForUser(String visitorEmail, String visitorName, String visitorPhone);

    ChatMessageDTO sendMessage(String sessionId, String message, String sender);

    List<ChatMessageDTO> getConversation(String sessionId);

    default List<ChatMessageDTO> getMessages(String sessionId) {
        return getConversation(sessionId);
    }

    ChatSessionDTO getChatSession(String sessionId);

    ChatSessionDTO assignChatToAdmin(String sessionId, Long adminId, String adminName);

    void closeChat(String sessionId, String reason);

    long getWaitingQueueCount();

    List<ChatSessionDTO> getWaitingQueue();

    List<ChatSessionDTO> getOpenChats();

    List<ChatSessionDTO> getAdminActiveChats(Long adminId);

    void markMessageAsRead(Long messageId);

    void updateQueuePositions();
}
