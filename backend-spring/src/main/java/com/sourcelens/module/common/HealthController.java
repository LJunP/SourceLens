package com.sourcelens.module.common;

import com.sourcelens.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Operation(summary = "健康检查")
    @GetMapping("/health")
    public Result<Map<String, String>> health() {
        return Result.ok(Map.of(
                "status", "UP",
                "service", "sourcelens-backend"
        ));
    }
}