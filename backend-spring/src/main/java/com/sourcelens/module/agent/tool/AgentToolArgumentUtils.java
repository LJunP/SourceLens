package com.sourcelens.module.agent.tool;

final class AgentToolArgumentUtils {

    private AgentToolArgumentUtils() {
    }

    static int boundedInt(Object value, int defaultValue, int min, int max) {
        if (!(value instanceof Number number)) {
            return defaultValue;
        }
        int parsed = number.intValue();
        if (parsed < min) {
            return min;
        }
        return Math.min(parsed, max);
    }
}
