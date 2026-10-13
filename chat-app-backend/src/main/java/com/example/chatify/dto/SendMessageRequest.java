package com.example.chatify.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequest(
        @NotNull(message = "Recipient ID is required")
        UUID recipientId,

        @NotBlank(message = "Message content cannot be empty")
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String content
) {
}
