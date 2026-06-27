package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.service.GitHubAppTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GitHubAppTokenServiceTest {

    @Test
    void isConfigured_shouldRequireAppIdAndPrivateKey() {
        GitHubAppTokenService service = new GitHubAppTokenService(new ObjectMapper());

        assertFalse(service.isConfigured());
        assertThrows(BizException.class, service::createAppJwt);
    }

    @Test
    void createAppJwt_shouldSignJwtWithConfiguredPrivateKey() throws Exception {
        KeyPair keyPair = generateRsaKeyPair();
        GitHubAppTokenService service = new GitHubAppTokenService(new ObjectMapper());
        ReflectionTestUtils.setField(service, "appId", "123456");
        ReflectionTestUtils.setField(service, "privateKeyPem", toPkcs8Pem(keyPair));

        String jwt = service.createAppJwt();

        assertEquals(3, jwt.split("\\.").length);
        Claims claims = Jwts.parser()
                .verifyWith((RSAPublicKey) keyPair.getPublic())
                .build()
                .parseSignedClaims(jwt)
                .getPayload();
        assertEquals("123456", claims.getIssuer());
        assertTrue(claims.getExpiration().after(claims.getIssuedAt()));
    }

    @Test
    void createInstallationAccessToken_shouldExchangeTokenWithGitHubApi() throws Exception {
        KeyPair keyPair = generateRsaKeyPair();
        FakeHttpClient httpClient = new FakeHttpClient("{\"token\":\"installation-token\"}");
        GitHubAppTokenService service = new GitHubAppTokenService(new ObjectMapper(), Clock.systemUTC(), httpClient);
        ReflectionTestUtils.setField(service, "appId", "123456");
        ReflectionTestUtils.setField(service, "privateKeyPem", toPkcs8Pem(keyPair));
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");

        String token = service.createInstallationAccessToken(99L);

        assertEquals("installation-token", token);
        assertEquals(URI.create("https://api.github.test/app/installations/99/access_tokens"), httpClient.request.uri());
        String authHeader = httpClient.request.headers().firstValue("Authorization").orElseThrow();
        assertTrue(authHeader.startsWith("Bearer "));
        String appJwt = authHeader.substring("Bearer ".length());
        Jwts.parser()
                .verifyWith((RSAPublicKey) keyPair.getPublic())
                .build()
                .parseSignedClaims(appJwt);
    }

    @Test
    void createInstallationAccessToken_shouldRejectUnsafeApiBaseUrlBeforeHttpSend() throws Exception {
        KeyPair keyPair = generateRsaKeyPair();
        FakeHttpClient httpClient = new FakeHttpClient("{\"token\":\"installation-token\"}");
        GitHubAppTokenService service = new GitHubAppTokenService(new ObjectMapper(), Clock.systemUTC(), httpClient);
        ReflectionTestUtils.setField(service, "appId", "123456");
        ReflectionTestUtils.setField(service, "privateKeyPem", toPkcs8Pem(keyPair));
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://169.254.169.254");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "169.254.169.254");

        var ex = assertThrows(BizException.class, () -> service.createInstallationAccessToken(99L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    private KeyPair generateRsaKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private String toPkcs8Pem(KeyPair keyPair) {
        String encoded = Base64.getMimeEncoder(64, "\n".getBytes())
                .encodeToString(keyPair.getPrivate().getEncoded());
        return "-----BEGIN PRIVATE KEY-----\n" + encoded + "\n-----END PRIVATE KEY-----";
    }

    private static class FakeHttpClient extends HttpClient {
        private final String responseBody;
        private HttpRequest request;

        private FakeHttpClient(String responseBody) {
            this.responseBody = responseBody;
        }

        @Override
        public Optional<CookieHandler> cookieHandler() {
            return Optional.empty();
        }

        @Override
        public Optional<Duration> connectTimeout() {
            return Optional.empty();
        }

        @Override
        public Redirect followRedirects() {
            return Redirect.NEVER;
        }

        @Override
        public Optional<ProxySelector> proxy() {
            return Optional.empty();
        }

        @Override
        public SSLContext sslContext() {
            return null;
        }

        @Override
        public SSLParameters sslParameters() {
            return null;
        }

        @Override
        public Optional<Authenticator> authenticator() {
            return Optional.empty();
        }

        @Override
        public Version version() {
            return Version.HTTP_1_1;
        }

        @Override
        public Optional<Executor> executor() {
            return Optional.empty();
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) {
            this.request = request;
            return (HttpResponse<T>) new FakeHttpResponse(responseBody);
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                HttpResponse.BodyHandler<T> responseBodyHandler) {
            throw new UnsupportedOperationException("sendAsync is not used in this test");
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                HttpResponse.BodyHandler<T> responseBodyHandler,
                                                                HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            throw new UnsupportedOperationException("sendAsync is not used in this test");
        }
    }

    private record FakeHttpResponse(String body) implements HttpResponse<String> {
        @Override
        public int statusCode() {
            return 201;
        }

        @Override
        public HttpRequest request() {
            return null;
        }

        @Override
        public Optional<HttpResponse<String>> previousResponse() {
            return Optional.empty();
        }

        @Override
        public HttpHeaders headers() {
            return HttpHeaders.of(java.util.Map.of(), (k, v) -> true);
        }

        @Override
        public Optional<javax.net.ssl.SSLSession> sslSession() {
            return Optional.empty();
        }

        @Override
        public URI uri() {
            return URI.create("https://api.github.test");
        }

        @Override
        public HttpClient.Version version() {
            return HttpClient.Version.HTTP_1_1;
        }
    }
}
