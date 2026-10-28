
package com.example.chatify.kafka;

import com.example.chatify.dto.MessageResponse;
import com.example.chatify.event.ChatMessageEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class ChatMessageKafkaProducer {

    private static final Logger log =
            LoggerFactory.getLogger(ChatMessageKafkaProducer.class);

    private static final String TOPIC = "chatify.messages";

    private final KafkaTemplate<String, ChatMessageEvent> kafkaTemplate;

    public ChatMessageKafkaProducer(
            KafkaTemplate<String, ChatMessageEvent> kafkaTemplate
    ) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(MessageResponse message) {
        ChatMessageEvent event = new ChatMessageEvent(
                message.id(),
                message.senderId(),
                message.recipientId(),
                message.content(),
                message.createdAt()
        );

        log.info("Publishing message {} to Kafka topic {}",
                message.id(), TOPIC);

        CompletableFuture<SendResult<String, ChatMessageEvent>> future =
                kafkaTemplate.send(
                        TOPIC,
                        message.id().toString(),
                        event
                );

        future.whenComplete((result, exception) -> {
            if (exception != null) {
                log.error("Failed to publish message {} to Kafka",
                        message.id(), exception);
            } else {
                log.info("Message {} published to Kafka topic {}, partition {}, offset {}",
                        message.id(),
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
