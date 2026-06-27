package com.sourcelens.common.security;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * AES 对称加密工具,用于加密存储 GitHub Token 等敏感信息
 * 使用 AES-256-GCM 并保留旧 AES-CBC 密文的读取兼容
 */
public class TokenEncryptor {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String LEGACY_TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final String VERSION_PREFIX = "SLENC2:";
    private static final int KEY_LENGTH = 256;
    private static final int ITERATION_COUNT = 65536;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int LEGACY_IV_LENGTH = 16;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenEncryptor(String password, String salt) {
        try {
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            PBEKeySpec spec = new PBEKeySpec(
                    password.toCharArray(),
                    salt.getBytes(StandardCharsets.UTF_8),
                    ITERATION_COUNT,
                    KEY_LENGTH
            );
            byte[] keyBytes = factory.generateSecret(spec).getEncoded();
            this.secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
        } catch (Exception e) {
            throw new RuntimeException("初始化加密器失败", e);
        }
    }

    /**
     * 加密明文
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            throw new IllegalArgumentException("加密内容不能为空");
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // IV + 密文拼接后 Base64 编码
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return VERSION_PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("加密失败", e);
        }
    }

    /**
     * 解密密文
     */
    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return null;
        }
        try {
            if (cipherText.startsWith(VERSION_PREFIX)) {
                return decryptAuthenticated(cipherText.substring(VERSION_PREFIX.length()));
            }
            return decryptLegacy(cipherText);
        } catch (Exception e) {
            throw new RuntimeException("解密失败", e);
        }
    }

    /**
     * 判断字符串是否已加密(Base64 格式且长度合理)
     */
    public static boolean isEncrypted(String value) {
        if (value == null || value.isBlank()) return false;
        try {
            if (value.startsWith(VERSION_PREFIX)) {
                byte[] decoded = Base64.getDecoder().decode(value.substring(VERSION_PREFIX.length()));
                return decoded.length > GCM_IV_LENGTH + 16;
            }
            byte[] decoded = Base64.getDecoder().decode(value);
            return decoded.length > LEGACY_IV_LENGTH;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 判断 token 是否有效(非空且非空白)
     */
    public static boolean isValidToken(String token) {
        return token != null && !token.isBlank();
    }

    private String decryptAuthenticated(String encoded) throws Exception {
        byte[] combined = Base64.getDecoder().decode(encoded);
        if (combined.length <= GCM_IV_LENGTH + 16) {
            throw new IllegalArgumentException("密文长度不合法");
        }

        byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_LENGTH);
        byte[] encrypted = Arrays.copyOfRange(combined, GCM_IV_LENGTH, combined.length);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
        byte[] decrypted = cipher.doFinal(encrypted);
        return decodeUtf8Strict(decrypted);
    }

    private String decryptLegacy(String cipherText) throws Exception {
        byte[] combined = Base64.getDecoder().decode(cipherText);
        if (combined.length <= LEGACY_IV_LENGTH) {
            throw new IllegalArgumentException("密文长度不合法");
        }

        byte[] iv = Arrays.copyOfRange(combined, 0, LEGACY_IV_LENGTH);
        byte[] encrypted = Arrays.copyOfRange(combined, LEGACY_IV_LENGTH, combined.length);

        Cipher cipher = Cipher.getInstance(LEGACY_TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));
        byte[] decrypted = cipher.doFinal(encrypted);
        return decodeUtf8Strict(decrypted);
    }

    private static String decodeUtf8Strict(byte[] value) throws CharacterCodingException {
        return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(value))
                .toString();
    }
}
