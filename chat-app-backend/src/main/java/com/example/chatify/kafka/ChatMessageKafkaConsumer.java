
package com.example.chatify.kafka;

import com.example.chatify.event.ChatMessageEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ChatMessageKafkaConsumer {

    private static final Logger log =
            LoggerFactory.getLogger(ChatMessageKafkaConsumer.class);

    @KafkaListener(
            topics = "chatify.messages",
            groupId = "chatify-message-group"
    )
    public void consume(ChatMessageEvent event) {
        log.info(
                "Consumed Kafka event: messageId={}, senderId={}, recipientId={}, content={}, createdAt={}",
                event.messageId(),
                event.senderId(),
                event.recipientId(),
                event.content(),
                event.createdAt()
        );
    }
}
