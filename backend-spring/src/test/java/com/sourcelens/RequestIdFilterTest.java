package com.sourcelens;

import com.sourcelens.common.web.RequestIdFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import static org.hamcrest.Matchers.matchesPattern;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RequestIdFilterTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new RequestIdEchoController())
                .addFilters(new RequestIdFilter())
                .build();
    }

    @Test
    void shouldPropagateValidRequestIdToResponseAttributeAndMdc() throws Exception {
        mockMvc.perform(get("/request-id").header(RequestIdFilter.HEADER_NAME, "req-client-1"))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestIdFilter.HEADER_NAME, "req-client-1"))
                .andExpect(jsonPath("$.attribute").value("req-client-1"))
                .andExpect(jsonPath("$.mdc").value("req-client-1"));

        assertNull(MDC.get(RequestIdFilter.MDC_KEY));
    }

    @Test
    void shouldGenerateRequestIdWhenHeaderIsUnsafe() throws Exception {
        mockMvc.perform(get("/request-id").header(RequestIdFilter.HEADER_NAME, "bad\nid"))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestIdFilter.HEADER_NAME, matchesPattern("req-[0-9a-fA-F-]{36}")))
                .andExpect(jsonPath("$.attribute", matchesPattern("req-[0-9a-fA-F-]{36}")))
                .andExpect(jsonPath("$.mdc", matchesPattern("req-[0-9a-fA-F-]{36}")));

        assertNull(MDC.get(RequestIdFilter.MDC_KEY));
    }

    @RestController
    static class RequestIdEchoController {
        @GetMapping("/request-id")
        ResponseEntity<Map<String, String>> requestId(jakarta.servlet.http.HttpServletRequest request) {
            return ResponseEntity.ok(Map.of(
                    "attribute", String.valueOf(request.getAttribute(RequestIdFilter.REQUEST_ATTRIBUTE)),
                    "mdc", String.valueOf(MDC.get(RequestIdFilter.MDC_KEY))
            ));
        }
    }
}
