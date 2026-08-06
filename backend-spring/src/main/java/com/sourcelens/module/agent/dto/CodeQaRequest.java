package com.sourcelens.module.agent.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CodeQaRequest {

    @NotBlank(message = "问题内容不能为空")
    private String question;

    private Long scanTaskId;

    private EvidenceRef evidenceRef;

    @Data
    public static class EvidenceRef {
        private String category;
        private String source;
        private String title;
        private String summary;
        private String filePath;
        private String lineNumber;
        @JsonAlias("start_line")
        private Integer startLine;
        @JsonAlias("end_line")
        private Integer endLine;
    }
}
