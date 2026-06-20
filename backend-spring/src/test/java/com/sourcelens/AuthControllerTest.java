package com.sourcelens;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registerAndLogin() throws Exception {
        String username = "testuser_" + System.currentTimeMillis();
        String email = "test_" + System.currentTimeMillis() + "@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "email": "%s", "password": "test123456"}
                                """, username, email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "password": "test123456"}
                                """, username)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    void registerWithDuplicateUsernameFails() throws Exception {
        String username = "dupuser_" + System.currentTimeMillis();
        String body = String.format("""
                {"username": "%s", "email": "%s@example.com", "password": "test123456"}
                """, username, username);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        String body2 = String.format("""
                {"username": "%s", "email": "%s2@example.com", "password": "test123456"}
                """, username, username);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isConflict());
    }

    @Test
    void loginWithWrongPasswordFails() throws Exception {
        String username = "wrongpwd_" + System.currentTimeMillis();
        String email = username + "@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "email": "%s", "password": "correct123"}
                                """, username, email)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "password": "wrongpass"}
                                """, username)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerValidationFails() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username": "", "email": "a@b.com", "password": "12345"}
                                """))
                .andExpect(status().isBadRequest());
    }
}