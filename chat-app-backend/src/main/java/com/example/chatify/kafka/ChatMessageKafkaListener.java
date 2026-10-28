
package com.example.chatify.kafka;

import com.example.chatify.event.ChatMessageSavedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ChatMessageKafkaListener {

    private final ChatMessageKafkaProducer kafkaProducer;
    private static final Logger log = LoggerFactory.getLogger(ChatMessageKafkaListener.class);

    public ChatMessageKafkaListener(ChatMessageKafkaProducer kafkaProducer) {
        this.kafkaProducer = kafkaProducer;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMessageSaved(ChatMessageSavedEvent event) {
        log.info("Received committed message event: {}",
                event.message().id());

        kafkaProducer.publish(event.message());
    }
}
