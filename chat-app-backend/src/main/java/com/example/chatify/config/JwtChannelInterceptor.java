
package com.example.chatify.config;

import com.example.chatify.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

import java.security.Principal;
import java.util.UUID;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public JwtChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            throw new MessagingException("Invalid STOMP message");
        }

        StompCommand command = accessor.getCommand();

        if (command == StompCommand.CONNECT) {
            authenticateConnection(accessor);
            return message;
        }

        if (command == StompCommand.DISCONNECT
                || command == StompCommand.UNSUBSCRIBE) {
            return message;
        }

        if (command == StompCommand.SEND) {
            requireAuthenticatedUser(accessor);

            String destination = accessor.getDestination();

            if (!"/app/chat.send".equals(destination)) {
                throw new MessagingException(
                        "Sending to this destination is not allowed"
                );
            }

            return message;
        }

        if (command == StompCommand.SUBSCRIBE) {
            requireAuthenticatedUser(accessor);

            String destination = accessor.getDestination();

            if (!"/user/queue/messages".equals(destination)) {
                throw new MessagingException(
                        "Subscribing to this destination is not allowed"
                );
            }

            return message;
        }

        throw new MessagingException(
                "This STOMP command is not allowed"
        );
    }

    private void authenticateConnection(
            StompHeaderAccessor accessor
    ) {
        String header = accessor.getFirstNativeHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            throw new MessagingException(
                    "Missing WebSocket authentication token"
            );
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtService.parseToken(token);
            UUID userId = UUID.fromString(claims.getSubject());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId.toString(),
                            null,
                            AuthorityUtils.NO_AUTHORITIES
                    );

            accessor.setUser(authentication);

        } catch (JwtException | IllegalArgumentException ex) {
            throw new MessagingException(
                    "Invalid or expired WebSocket authentication token",
                    ex
            );
        }
    }

    private void requireAuthenticatedUser(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();

        if (!(principal instanceof Authentication authentication)
                || !authentication.isAuthenticated()) {
            throw new MessagingException(
                    "WebSocket authentication is required"
            );
        }
    }
}
