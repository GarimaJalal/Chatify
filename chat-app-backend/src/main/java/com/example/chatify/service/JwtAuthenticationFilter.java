package com.example.chatify.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtService.parseToken(token);
            UUID userId = UUID.fromString(claims.getSubject());
            String email = claims.get("email", String.class);

            var currentAuth =
                    SecurityContextHolder.getContext().getAuthentication();

            if (currentAuth == null || !currentAuth.isAuthenticated()) {
                var authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                AuthorityUtils.NO_AUTHORITIES
                        );

                authentication.setDetails(email);

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }

        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid or expired JWT token"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}
