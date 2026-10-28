
package com.example.chatify.config;

import com.example.chatify.event.ChatMessageEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.kafka.common.serialization.Deserializer;
import org.apache.kafka.common.serialization.Serde;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.common.serialization.Serializer;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.Consumed;
import org.apache.kafka.streams.kstream.Grouped;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.KTable;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.Produced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;


@Configuration
@EnableKafkaStreams
public class ChatMessageStreamsConfig {

    @Bean
    public KStream<String, ChatMessageEvent> chatMessageStream(
            StreamsBuilder streamsBuilder
    ) {
        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule());
        Serializer<ChatMessageEvent> serializer = (topic, event) -> {
            try {
                return objectMapper.writeValueAsBytes(event);
            } catch (Exception exception) {
                throw new IllegalStateException(
                        "Could not serialize chat message event", exception
                );
            }
        };

        Deserializer<ChatMessageEvent> deserializer = (topic, bytes) -> {
            try {
                return bytes == null ? null :
                        objectMapper.readValue(bytes, ChatMessageEvent.class);
            } catch (Exception exception) {
                throw new IllegalStateException(
                        "Could not deserialize chat message event", exception
                );
            }
        };

        Serde<ChatMessageEvent> eventSerde =
                Serdes.serdeFrom(serializer, deserializer);

        KStream<String, ChatMessageEvent> messages =
                streamsBuilder.stream(
                        "chatify.messages",
                        Consumed.with(Serdes.String(), eventSerde)
                );

        KTable<String, Long> messageCounts = messages
                .groupBy(
                        (key, event) -> event.senderId().toString(),
                        Grouped.with(Serdes.String(), eventSerde)
                )
                .count(
                        Materialized.with(
                                Serdes.String(), Serdes.Long()
                        )
                );

        messageCounts.toStream().to(
                "chatify.user-message-counts",
                Produced.with(Serdes.String(), Serdes.Long())
        );

        return messages;
    }
}
