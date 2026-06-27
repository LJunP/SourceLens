package com.sourcelens.module.agent.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.agent.dto.LlmConfigRequest;
import com.sourcelens.module.agent.dto.LlmConfigResponse;
import com.sourcelens.module.agent.service.LlmConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "LLM 模型配置")
@RestController
@RequestMapping("/api/llm-configs")
@RequiredArgsConstructor
public class LlmConfigController {

    private final LlmConfigService llmConfigService;

    @Operation(summary = "创建 LLM 配置")
    @PostMapping
    public Result<LlmConfigResponse> create(@Valid @RequestBody LlmConfigRequest req,
                                            @RequestAttribute("userId") Long userId) {
        return Result.ok(llmConfigService.toResponse(llmConfigService.create(req, userId)));
    }

    @Operation(summary = "获取当前用户的 LLM 配置列表")
    @GetMapping
    public Result<List<LlmConfigResponse>> list(@RequestAttribute("userId") Long userId) {
        return Result.ok(llmConfigService.listResponsesByUser(userId));
    }

    @Operation(summary = "获取当前激活的 LLM 配置")
    @GetMapping("/active")
    public Result<LlmConfigResponse> getActive(@RequestAttribute("userId") Long userId) {
        return Result.ok(llmConfigService.getActiveConfigResponse(userId));
    }

    @Operation(summary = "激活指定配置")
    @PostMapping("/{configId}/activate")
    public Result<LlmConfigResponse> activate(@PathVariable Long configId,
                                              @RequestAttribute("userId") Long userId) {
        return Result.ok(llmConfigService.toResponse(llmConfigService.activate(configId, userId)));
    }

    @Operation(summary = "更新 LLM 配置")
    @PutMapping("/{configId}")
    public Result<LlmConfigResponse> update(@PathVariable Long configId,
                                            @Valid @RequestBody LlmConfigRequest req,
                                            @RequestAttribute("userId") Long userId) {
        return Result.ok(llmConfigService.toResponse(llmConfigService.update(configId, req, userId)));
    }

    @Operation(summary = "删除 LLM 配置")
    @DeleteMapping("/{configId}")
    public Result<Void> delete(@PathVariable Long configId,
                               @RequestAttribute("userId") Long userId) {
        llmConfigService.remove(configId, userId);
        return Result.ok(null);
    }
}
