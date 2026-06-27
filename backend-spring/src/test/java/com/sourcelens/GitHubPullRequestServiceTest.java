package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubPullRequestService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import java.io.IOException;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GitHubPullRequestServiceTest {

    @Test
    void createPullRequest_shouldPostToGitHubPullsApi() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        String prUrl = service.createPullRequest(
                repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body");

        assertEquals("https://github.com/acme/api/pull/7", prUrl);
        assertEquals(URI.create("https://api.github.test/repos/acme/api/pulls"), httpClient.request.uri());
        assertEquals("Bearer installation-token",
                httpClient.request.headers().firstValue("Authorization").orElseThrow());
        assertEquals("POST", httpClient.request.method());
    }

    @Test
    void createPullRequest_shouldRejectApiHostOutsideAllowlist() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://evil.example");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.com");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void createPullRequest_shouldRejectPrivateApiHostEvenWhenAllowlisted() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://10.0.0.4");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "10.0.0.4");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    @Test
    void createPullRequest_shouldRejectUnsafeRepositoryComponentsBeforeHttp() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api/pulls")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    @Test
    void createPullRequest_shouldRejectUnsafeRepositoryOwnerBeforeHttp() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("..")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    @Test
    void createPullRequest_shouldRejectDotSegmentRepositoryComponentsBeforeHttp() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api..service")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    @Test
    void createPullRequest_shouldRejectGitSuffixRepositoryComponentsBeforeHttp() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api.git")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    @Test
    void createPullRequest_shouldRejectUnsafeBranchesBeforeHttp() {
        FakeHttpClient httpClient = new FakeHttpClient(201, "{\"html_url\":\"https://github.com/acme/api/pull/7\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "../unsafe", "main", "title", "body"));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals(null, httpClient.request);
    }

    @Test
    void createPullRequest_shouldMapPermissionFailuresToForbidden() {
        FakeHttpClient httpClient = new FakeHttpClient(403, "{\"message\":\"Resource not accessible by integration\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void createPullRequest_shouldMapValidationFailuresToConflict() {
        FakeHttpClient httpClient = new FakeHttpClient(422, "{\"message\":\"Validation Failed\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("CONFLICT", ex.getCode());
    }

    @Test
    void createPullRequest_shouldMapDuplicatePrFailuresToConflict() {
        FakeHttpClient httpClient = new FakeHttpClient(409, "{\"message\":\"A pull request already exists\"}");
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("CONFLICT", ex.getCode());
        assertEquals(true, ex.getMessage().contains("status=409"));
    }

    @Test
    void createPullRequest_shouldMapNetworkFailureToInternalWithoutLeakingToken() {
        FakeHttpClient httpClient = new FakeHttpClient(new IOException("connect failed for installation-token"));
        GitHubPullRequestService service = new GitHubPullRequestService(new ObjectMapper(), httpClient);
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.github.test");
        ReflectionTestUtils.setField(service, "allowedApiHosts", "api.github.test");
        Repository repo = Repository.builder()
                .owner("acme")
                .name("api")
                .build();

        var ex = assertThrows(com.sourcelens.common.exception.BizException.class,
                () -> service.createPullRequest(
                        repo, "installation-token", "sourcelens/auto-repair-12", "main", "title", "body"));

        assertEquals("INTERNAL", ex.getCode());
        assertEquals(true, ex.getMessage().contains("GitHub Pull Request 网络请求失败"));
        assertEquals(false, ex.getMessage().contains("installation-token"));
        assertEquals(true, ex.getMessage().contains("[REDACTED]"));
    }

    private static class FakeHttpClient extends HttpClient {
        private final int statusCode;
        private final String responseBody;
        private final IOException failure;
        private HttpRequest request;

        private FakeHttpClient(int statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
            this.failure = null;
        }

        private FakeHttpClient(IOException failure) {
            this.statusCode = 0;
            this.responseBody = "";
            this.failure = failure;
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
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler)
                throws IOException, InterruptedException {
            this.request = request;
            if (failure != null) {
                throw failure;
            }
            return (HttpResponse<T>) new FakeHttpResponse(statusCode, responseBody);
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

    private record FakeHttpResponse(int statusCode, String body) implements HttpResponse<String> {
        @Override
        public int statusCode() {
            return statusCode;
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
