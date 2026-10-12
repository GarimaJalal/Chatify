package com.example.chatify.service;

import com.example.chatify.dto.LoginRequest;
import com.example.chatify.dto.LoginResponse;
import com.example.chatify.dto.RegisterRequest;
import com.example.chatify.dto.RegisterResponse;
import com.example.chatify.model.Users;
import com.example.chatify.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class UserService {

    @Autowired
    UserRepository  userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtService jwtService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        String phoneNumber = request.phoneNumber().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Phone number is already registered"
            );
        }

        Users user = new Users();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);

        // Hash the password before storing it.
        user.setPassword(passwordEncoder.encode(request.password()));

        Users savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getEmail(),
                savedUser.getPhoneNumber()
        );
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail()
        );

        return new LoginResponse(
                token,
                "Bearer",
                86400,
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber()
        );
    }

}
