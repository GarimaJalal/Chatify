package com.example.chatify.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.Map;

@RestController
public class AuthTestController {

    @GetMapping("/api/auth/me")
    public Map<String, Object> me(Authentication authentication) {
        return Map.of(
                "userId", (UUID) authentication.getPrincipal(),
                "email", (String) authentication.getDetails()
        );
    }
}