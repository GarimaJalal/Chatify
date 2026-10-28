
package com.example.chatify.event;

import com.example.chatify.dto.MessageResponse;

public record ChatMessageSavedEvent(MessageResponse message) {
}
