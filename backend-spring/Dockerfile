# SourceLens Backend - Multi-stage build
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
# 先下载依赖(利用 Docker layer cache)
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime (使用 Ubuntu 基础镜像以兼容 ARM64 / Apple Silicon)
FROM eclipse-temurin:17-jre-jammy

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

RUN mkdir -p /var/lib/sourcelens/repos && chown -R app:app /var/lib/sourcelens/repos
USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]