package com.sourcelens.common.config;

import com.sourcelens.common.security.TokenEncryptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TokenEncryptorConfig {

    @Bean
    public TokenEncryptor tokenEncryptor(
            @Value("${sourcelens.encrypt.password}") String password,
            @Value("${sourcelens.encrypt.salt}") String salt) {
        return new TokenEncryptor(password, salt);
    }
}