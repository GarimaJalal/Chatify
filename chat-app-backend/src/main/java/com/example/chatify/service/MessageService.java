package com.example.chatify.service;

import com.example.chatify.dto.MessageResponse;
import com.example.chatify.dto.SendMessageRequest;
import com.example.chatify.event.ChatMessageSavedEvent;
import com.example.chatify.model.Message;
import com.example.chatify.model.MessageStatus;
import com.example.chatify.model.Users;
import com.example.chatify.repository.MessageRepository;
import com.example.chatify.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    @Autowired
    MessageRepository messageRepository;
    @Autowired
    UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public MessageService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public MessageResponse sendMessage(UUID senderId, SendMessageRequest request) {
        if (senderId.equals(request.recipientId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot send a message to yourself"
            );
        }

        Users sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Sender account not found"
                ));

        Users recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recipient not found"
                ));

        Message message = new Message();
        message.setId(UUID.randomUUID());
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(request.content().trim());

        Message savedMessage = messageRepository.save(message);

        MessageResponse response = toResponse(savedMessage);

        eventPublisher.publishEvent(new ChatMessageSavedEvent(response));

        return response;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getConversation(UUID currentUserId, UUID otherUserId) {
        if (currentUserId.equals(otherUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A conversation requires two different users"
            );
        }

        if (!userRepository.existsById(otherUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found"
            );
        }

        return messageRepository
                .findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderByCreatedAtAsc(
                        currentUserId,
                        otherUserId,
                        otherUserId,
                        currentUserId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MessageResponse updateMessageStatus(
            UUID recipientId,
            UUID messageId,
            MessageStatus newStatus
    ) {
        Message message = messageRepository
                .findByIdAndRecipient_Id(messageId, recipientId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Message not found or recipient is not authorized"
                        )
                );

        MessageStatus currentStatus = message.getStatus();

        if (currentStatus == MessageStatus.READ) {
            return toResponse(message);
        }

        if (newStatus == MessageStatus.READ
                || (currentStatus == MessageStatus.SENT
                && newStatus == MessageStatus.DELIVERED)) {

            message.setStatus(newStatus);
            messageRepository.save(message);
        }

        return toResponse(message);
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getRecipient().getId(),
                message.getContent(),
                message.getCreatedAt(),
                message.getStatus()
        );
    }
}
