
package com.example.chatify.event;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageEvent(
        UUID messageId,
        UUID senderId,
        UUID recipientId,
        String content,
        Instant createdAt
) {
}
