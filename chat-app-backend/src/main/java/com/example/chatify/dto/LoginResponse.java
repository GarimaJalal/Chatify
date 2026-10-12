package com.example.chatify.dto;

import java.util.UUID;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber
) {}
