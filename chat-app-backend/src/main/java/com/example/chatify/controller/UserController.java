package com.example.chatify.controller;

import com.example.chatify.dto.*;
import com.example.chatify.model.Users;
import com.example.chatify.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserService  userService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        RegisterResponse userResponse = userService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping
    public List<UserSummaryResponse> getAllUsers(Authentication authentication) {
        return userService.getAllUsers(authentication);
    }
}
