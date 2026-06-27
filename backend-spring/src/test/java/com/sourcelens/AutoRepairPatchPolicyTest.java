package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.autorepair.service.AutoRepairPatchPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AutoRepairPatchPolicyTest {

    @Test
    void validateAndNormalizeRelativeFilePath_shouldNormalizeSafePath() {
        assertEquals("src/main/App.java",
                AutoRepairPatchPolicy.validateAndNormalizeRelativeFilePath("src/main/../main/App.java"));
    }

    @Test
    void validateAndNormalizeRelativeFilePath_shouldRejectTraversalAndSecrets() {
        assertThrows(BizException.class,
                () -> AutoRepairPatchPolicy.validateAndNormalizeRelativeFilePath("../secret.yml"));
        assertThrows(BizException.class,
                () -> AutoRepairPatchPolicy.validateAndNormalizeRelativeFilePath(".env"));
        assertThrows(BizException.class,
                () -> AutoRepairPatchPolicy.validateAndNormalizeRelativeFilePath("config/prod.pem"));
    }

    @Test
    void validateSingleFilePatch_shouldAllowOnlyExpectedFile() {
        AutoRepairPatchPolicy.validateSingleFilePatch("src/App.java", """
                diff --git a/src/App.java b/src/App.java
                --- a/src/App.java
                +++ b/src/App.java
                @@ -1 +1 @@
                -old
                +new
                """);
    }

    @Test
    void validateSingleFilePatch_shouldRejectMultipleOrUnexpectedFiles() {
        assertThrows(BizException.class,
                () -> AutoRepairPatchPolicy.validateSingleFilePatch("src/App.java", """
                        diff --git a/src/App.java b/src/App.java
                        diff --git a/src/Other.java b/src/Other.java
                        """));
        assertThrows(BizException.class,
                () -> AutoRepairPatchPolicy.validateSingleFilePatch("src/App.java", """
                        diff --git a/.env b/.env
                        """));
    }
}
