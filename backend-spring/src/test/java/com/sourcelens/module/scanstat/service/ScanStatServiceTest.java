package com.sourcelens.module.scanstat.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScanStatServiceTest {

    @Test
    void normalizeRecentScanLimit_shouldClampToSafeRange() {
        assertEquals(1, ScanStatService.normalizeRecentScanLimit(-10));
        assertEquals(1, ScanStatService.normalizeRecentScanLimit(0));
        assertEquals(10, ScanStatService.normalizeRecentScanLimit(10));
        assertEquals(100, ScanStatService.normalizeRecentScanLimit(1000));
    }
}
