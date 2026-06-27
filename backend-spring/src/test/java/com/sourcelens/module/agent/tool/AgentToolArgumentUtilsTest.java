package com.sourcelens.module.agent.tool;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AgentToolArgumentUtilsTest {

    @Test
    void boundedInt_shouldUseDefaultForNonNumber() {
        assertEquals(50, AgentToolArgumentUtils.boundedInt("100", 50, 1, 100));
    }

    @Test
    void boundedInt_shouldClampToMinAndMax() {
        assertEquals(1, AgentToolArgumentUtils.boundedInt(-10, 50, 1, 100));
        assertEquals(100, AgentToolArgumentUtils.boundedInt(500, 50, 1, 100));
    }
}
