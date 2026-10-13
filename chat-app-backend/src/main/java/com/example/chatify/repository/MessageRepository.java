package com.example.chatify.repository;

import com.example.chatify.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message>
    findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderByCreatedAtAsc(
            UUID senderId,
            UUID recipientId,
            UUID recipientIdAgain,
            UUID senderIdAgain
    );
}
