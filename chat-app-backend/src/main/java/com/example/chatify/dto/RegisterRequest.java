package com.example.chatify.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "First name is required")
        @Size(max = 50)
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 50)
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Phone number is required")
        @Pattern(
                regexp = "^\\+?[0-9]{7,15}$",
                message = "Enter a valid phone number"
        )
        String phoneNumber,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72,
                message = "Password must be 8 to 72 characters")
        String password
) {}
