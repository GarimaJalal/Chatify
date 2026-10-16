
package com.example.chatify.controller;

import com.example.chatify.dto.MessageResponse;
import com.example.chatify.dto.SendMessageRequest;
import com.example.chatify.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWebSocketController {

    @Autowired
    MessageService messageService;
    @Autowired
    SimpMessagingTemplate messagingTemplate;


    @MessageMapping("/chat.send")
    public void sendMessage(
            SendMessageRequest request,
            Principal principal
    ) {
        if (principal == null) {
            throw new IllegalStateException(
                    "WebSocket user is not authenticated"
            );
        }

        UUID senderId = UUID.fromString(principal.getName());

        MessageResponse savedMessage =
                messageService.sendMessage(senderId, request);

        messagingTemplate.convertAndSendToUser(
                request.recipientId().toString(),
                "/queue/messages",
                savedMessage
        );

        messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/queue/messages",
                savedMessage
        );
    }
}
