package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.username").value(username))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.deleted").doesNotExist());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "password": "test123456"}
                                """, username)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data")
                .path("token")
                .asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(username))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.deleted").doesNotExist());

        Integer loginAuditCount = jdbcTemplate.queryForObject(
                "select count(*) from audit_logs where action = 'USER_LOGIN' and status = 'SUCCESS' and input_json like ?",
                Integer.class,
                "%" + username + "%");
        assertThat(loginAuditCount).isNotNull().isGreaterThanOrEqualTo(1);
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
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
    }

    @Test
    void registerWithDuplicateEmailFails() throws Exception {
        String base = "dupemail_" + System.currentTimeMillis();
        String email = base + "@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s_a", "email": "%s", "password": "test123456"}
                                """, base, email)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s_b", "email": "%s", "password": "test123456"}
                                """, base, email)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("邮箱已注册"));
    }

    @Test
    void registerWithSoftDeletedUsernameStillReturnsConflict() throws Exception {
        String username = "softdup_" + System.currentTimeMillis();
        String email = username + "@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "email": "%s", "password": "test123456"}
                                """, username, email)))
                .andExpect(status().isOk());

        jdbcTemplate.update("update users set deleted = 1 where username = ?", username);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "email": "%s2@example.com", "password": "test123456"}
                                """, username, username)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
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

        Integer failedAuditCount = jdbcTemplate.queryForObject(
                "select count(*) from audit_logs where action = 'USER_LOGIN' and status = 'FAILED' and input_json like ?",
                Integer.class,
                "%" + username + "%");
        assertThat(failedAuditCount).isNotNull().isGreaterThanOrEqualTo(1);
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

    @Test
    void logoutRevokesCurrentToken() throws Exception {
        String username = "logout_" + System.currentTimeMillis();
        String email = username + "@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "email": "%s", "password": "test123456"}
                                """, username, email)))
                .andExpect(status().isOk());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"username": "%s", "password": "test123456"}
                                """, username)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data")
                .path("token")
                .asText();

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        Integer logoutAuditCount = jdbcTemplate.queryForObject(
                "select count(*) from audit_logs where action = 'USER_LOGOUT' and status = 'SUCCESS'",
                Integer.class);
        assertThat(logoutAuditCount).isNotNull().isGreaterThanOrEqualTo(1);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
