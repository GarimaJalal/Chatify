package com.example.chatify.controller;

import com.example.chatify.dto.MessageResponse;
import com.example.chatify.dto.SendMessageRequest;
import com.example.chatify.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(
            Authentication authentication,
            @Valid @RequestBody SendMessageRequest request
    ) {
        UUID senderId = (UUID) authentication.getPrincipal();

        return messageService.sendMessage(senderId, request);
    }

    @GetMapping("/conversation/{otherUserId}")
    public List<MessageResponse> getConversation(
            Authentication authentication,
            @PathVariable UUID otherUserId
    ) {
        System.out.println("Conversation endpoint reached");

        UUID currentUserId = (UUID) authentication.getPrincipal();

        return messageService.getConversation(currentUserId, otherUserId);
    }
}
