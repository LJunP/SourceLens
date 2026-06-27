package com.sourcelens.module.analysis.service;

import com.sourcelens.module.analysis.dto.CodeChunkSearchItem;
import com.sourcelens.module.analysis.dto.CodeEvidenceProfile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CodeEvidenceProfileService {

    public CodeEvidenceProfile build(String retrievalMode,
                                     List<CodeChunkSearchItem> chunks,
                                     long totalChunks,
                                     long embeddedChunks,
                                     long matchedChunks) {
        List<CodeChunkSearchItem> safeChunks = chunks == null ? List.of() : chunks;
        List<CodeChunkSearchItem> primaryChunks = safeChunks.stream()
                .filter(chunk -> !"ADJACENT_CONTEXT".equals(chunk.getContextRole()))
                .toList();
        List<CodeChunkSearchItem> scoringChunks = primaryChunks.isEmpty() && !safeChunks.isEmpty() ? safeChunks : primaryChunks;
        int resultCount = scoringChunks.size();
        int contextChunkCount = Math.max(safeChunks.size() - resultCount, 0);
        int embeddingCoverage = totalChunks > 0 ? (int) Math.round((embeddedChunks * 100.0) / totalChunks) : 0;
        boolean truncated = matchedChunks > resultCount;

        if ("NO_SCAN".equals(retrievalMode)) {
            return emptyProfile("IDLE", 0,
                    "还没有成功扫描可用于代码问答",
                    "先触发一次公开仓库扫描，成功后再进行代码问答。",
                    List.of("未扫描", "无 code_chunks"));
        }
        if ("NO_CONTEXT".equals(retrievalMode) || totalChunks <= 0) {
            return emptyProfile("GAP", 12,
                    "扫描未产出可检索代码切片",
                    "重新扫描并检查 analyzer 与 chunk_code 步骤是否正常生成 code_chunks。",
                    List.of("扫描可用", "0 code_chunks"));
        }

        Map<String, Integer> typeCounts = new HashMap<>();
        Map<String, FileStatAccumulator> fileStats = new HashMap<>();
        int topScore = 0;
        int scoreSum = 0;
        int embeddedEvidenceCount = 0;
        int lowConfidenceCount = 0;
        int lineSpan = 0;
        for (CodeChunkSearchItem chunk : safeChunks) {
            int score = chunk.getRelevanceScore() == null ? 0 : chunk.getRelevanceScore();
            int startLine = chunk.getStartLine() == null ? 0 : chunk.getStartLine();
            int endLine = chunk.getEndLine() == null ? startLine : chunk.getEndLine();
            lineSpan += Math.max(endLine - startLine + 1, 1);

            String evidenceType = StringUtils.hasText(chunk.getEvidenceType()) ? chunk.getEvidenceType() : "OTHER";
            typeCounts.merge(evidenceType, 1, Integer::sum);

            String filePath = StringUtils.hasText(chunk.getFilePath()) ? chunk.getFilePath() : "unknown";
            FileStatAccumulator accumulator = fileStats.computeIfAbsent(filePath, FileStatAccumulator::new);
            accumulator.count++;
            accumulator.bestScore = Math.max(accumulator.bestScore, score);
        }
        for (CodeChunkSearchItem chunk : scoringChunks) {
            int score = chunk.getRelevanceScore() == null ? 0 : chunk.getRelevanceScore();
            topScore = Math.max(topScore, score);
            scoreSum += score;
            if (score < 45) {
                lowConfidenceCount++;
            }
            if (Boolean.TRUE.equals(chunk.getHasEmbedding())) {
                embeddedEvidenceCount++;
            }
        }

        List<CodeEvidenceProfile.EvidenceTypeStat> evidenceTypeStats = typeCounts.entrySet().stream()
                .map(entry -> CodeEvidenceProfile.EvidenceTypeStat.builder()
                        .type(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .sorted(Comparator
                        .comparing(CodeEvidenceProfile.EvidenceTypeStat::getCount).reversed()
                        .thenComparing(CodeEvidenceProfile.EvidenceTypeStat::getType))
                .toList();
        List<CodeEvidenceProfile.FileStat> fileStatResponses = fileStats.values().stream()
                .map(stat -> CodeEvidenceProfile.FileStat.builder()
                        .filePath(stat.filePath)
                        .count(stat.count)
                        .bestScore(stat.bestScore)
                        .build())
                .sorted(Comparator
                        .comparing(CodeEvidenceProfile.FileStat::getCount).reversed()
                        .thenComparing(CodeEvidenceProfile.FileStat::getBestScore, Comparator.reverseOrder())
                        .thenComparing(CodeEvidenceProfile.FileStat::getFilePath))
                .limit(6)
                .toList();

        int averageScore = resultCount > 0 ? (int) Math.round(scoreSum * 1.0 / resultCount) : 0;
        int confidence = calculateConfidence(retrievalMode, resultCount, matchedChunks, embeddingCoverage,
                averageScore, lowConfidenceCount, truncated);
        String readiness = confidence >= 76 && lowConfidenceCount == 0 ? "READY"
                : confidence >= 42 ? "REVIEW"
                : "GAP";
        String modeText = retrievalModeLabel(retrievalMode);
        String summary = resultCount > 0
                ? modeText + " · " + resultCount + " 条主证据" + (contextChunkCount > 0 ? " · " + contextChunkCount + " 条上下文" : "") + " · 平均分 " + averageScore
                : "当前问题没有找到直接代码证据";
        List<String> details = new ArrayList<>();
        details.add(totalChunks + " code_chunks");
        details.add("向量覆盖 " + embeddingCoverage + "%");
        details.add(truncated ? "结果已截断" : "结果未截断");
        details.add(fileStats.size() + " 个证据文件");
        if (contextChunkCount > 0) {
            details.add(contextChunkCount + " 条上下文补充");
        }

        return CodeEvidenceProfile.builder()
                .readiness(readiness)
                .confidence(confidence)
                .summary(summary)
                .nextAction(nextAction(confidence, retrievalMode, embeddingCoverage, resultCount))
                .details(details)
                .uniqueFiles(fileStats.size())
                .embeddedEvidenceCount(embeddedEvidenceCount)
                .lowConfidenceCount(lowConfidenceCount)
                .topScore(topScore)
                .averageScore(averageScore)
                .lineSpan(lineSpan)
                .dominantEvidenceType(evidenceTypeStats.isEmpty() ? "OTHER" : evidenceTypeStats.get(0).getType())
                .evidenceTypeStats(evidenceTypeStats)
                .fileStats(fileStatResponses)
                .build();
    }

    private CodeEvidenceProfile emptyProfile(String readiness,
                                             int confidence,
                                             String summary,
                                             String nextAction,
                                             List<String> details) {
        return CodeEvidenceProfile.builder()
                .readiness(readiness)
                .confidence(confidence)
                .summary(summary)
                .nextAction(nextAction)
                .details(details)
                .uniqueFiles(0)
                .embeddedEvidenceCount(0)
                .lowConfidenceCount(0)
                .topScore(0)
                .averageScore(0)
                .lineSpan(0)
                .dominantEvidenceType("NONE")
                .evidenceTypeStats(List.of())
                .fileStats(List.of())
                .build();
    }

    private int calculateConfidence(String retrievalMode,
                                    int resultCount,
                                    long matchedChunks,
                                    int embeddingCoverage,
                                    int averageScore,
                                    int lowConfidenceCount,
                                    boolean truncated) {
        if (resultCount <= 0) {
            return 18;
        }
        Map<String, Integer> baseByMode = Map.of(
                "HYBRID", 76,
                "SEMANTIC_FALLBACK", 66,
                "KEYWORD", 58,
                "STABLE_FALLBACK", 38
        );
        int base = baseByMode.getOrDefault(retrievalMode, 52);
        int hitBoost = matchedChunks > 0 ? (int) Math.round(Math.min(resultCount * 1.0 / matchedChunks, 1.0) * 10) : 4;
        int scoreBoost = Math.min(Math.max(averageScore / 8, 0), 14);
        int coverageBoost = Math.min(Math.max(embeddingCoverage / 6, 0), 16);
        int lowConfidencePenalty = Math.min(lowConfidenceCount * 8, 24);
        int truncationPenalty = truncated ? 8 : 0;
        return Math.max(5, Math.min(96, base + hitBoost + scoreBoost + coverageBoost - lowConfidencePenalty - truncationPenalty));
    }

    private String retrievalModeLabel(String retrievalMode) {
        return switch (retrievalMode == null ? "" : retrievalMode) {
            case "HYBRID" -> "混合召回";
            case "SEMANTIC_FALLBACK" -> "语义召回";
            case "STABLE_FALLBACK" -> "稳定回退";
            case "NO_SCAN" -> "未扫描";
            case "NO_CONTEXT" -> "无上下文";
            default -> "关键词召回";
        };
    }

    private String nextAction(int confidence, String retrievalMode, int embeddingCoverage, int resultCount) {
        if (resultCount <= 0) {
            return "换用类名、函数名、路径或业务名重新检索。";
        }
        if (confidence >= 76) {
            return "可基于当前证据继续追问实现细节、生成报告段落或进入自动修复候选筛选。";
        }
        if ("STABLE_FALLBACK".equals(retrievalMode)) {
            return "当前只使用稳定回退证据，建议补充关键词或重新扫描。";
        }
        if (embeddingCoverage < 60) {
            return "优先补齐 chunk embedding，提高语义召回稳定性。";
        }
        return "建议打开引用文件复核关键路径后再采纳结论。";
    }

    private static class FileStatAccumulator {
        private final String filePath;
        private int count;
        private int bestScore;

        private FileStatAccumulator(String filePath) {
            this.filePath = filePath;
        }
    }
}
