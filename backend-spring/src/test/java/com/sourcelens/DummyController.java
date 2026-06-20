package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class DummyController {

    @GetMapping("/dummy/notfound")
    void notFound() {
        throw BizException.notFound("Resource");
    }

    @GetMapping("/dummy/forbidden")
    void forbidden() {
        throw BizException.forbidden("Access denied");
    }

    @GetMapping("/dummy/badrequest")
    void badRequest() {
        throw BizException.badRequest("Invalid input");
    }

    @GetMapping("/dummy/error")
    void error() {
        throw new RuntimeException("Something broke");
    }
}