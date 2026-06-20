package com.sourcelens;

import com.sourcelens.common.security.TokenEncryptor;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TokenEncryptorTest {

    private final TokenEncryptor encryptor = new TokenEncryptor("test-password", "test-salt");

    @Test
    void encryptDecryptRoundTrip() {
        String original = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx1234";
        String encrypted = encryptor.encrypt(original);

        assertNotEquals(original, encrypted, "密文不应与明文相同");
        String decrypted = encryptor.decrypt(encrypted);
        assertEquals(original, decrypted, "解密后应与原文一致");
    }

    @Test
    void differentEncryptionsProduceDifferentCiphertext() {
        String text = "ghp_same_token";
        String enc1 = encryptor.encrypt(text);
        String enc2 = encryptor.encrypt(text);

        // 由于 IV 随机,两次加密结果应不同
        assertNotEquals(enc1, enc2, "相同明文两次加密应产生不同密文(随机 IV)");
        // 但解密后应一致
        assertEquals(text, encryptor.decrypt(enc1));
        assertEquals(text, encryptor.decrypt(enc2));
    }

    @Test
    void isEncryptedReturnsTrueForEncryptedValue() {
        String encrypted = encryptor.encrypt("some-token");
        assertTrue(TokenEncryptor.isEncrypted(encrypted), "加密后的值应被识别为已加密");
    }

    @Test
    void isEncryptedReturnsFalseForPlainText() {
        assertFalse(TokenEncryptor.isEncrypted("ghp_plain_token"), "明文不应被识别为已加密");
        assertFalse(TokenEncryptor.isEncrypted(null), "null 不应被识别为已加密");
        assertFalse(TokenEncryptor.isEncrypted(""), "空字符串不应被识别为已加密");
    }

    @Test
    void differentPasswordCannotDecrypt() {
        TokenEncryptor other = new TokenEncryptor("wrong-password", "test-salt");
        String encrypted = encryptor.encrypt("secret");

        assertThrows(RuntimeException.class, () -> other.decrypt(encrypted),
                "不同密码解密应失败");
    }
}