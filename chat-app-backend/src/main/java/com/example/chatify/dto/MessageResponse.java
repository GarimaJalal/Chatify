package com.example.chatify.dto;

import com.example.chatify.model.MessageStatus;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID senderId,
        UUID recipientId,
        String content,
        Instant createdAt,
        MessageStatus status
) {}