package com.sourcelens;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@MapperScan("com.sourcelens.**.mapper")
public class SourceLensApplication {

    public static void main(String[] args) {
        SpringApplication.run(SourceLensApplication.class, args);
    }
}