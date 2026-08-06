# SourceLens Backend - Multi-stage build
# Build this file from the repository root:
# docker build -f backend-spring/Dockerfile .

FROM maven:3.9-eclipse-temurin-17@sha256:e8ef73dbd33b69fe497fd96b3bbbd85aff84ac4c564a5784ab02ad941b32c12b AS backend-builder

WORKDIR /app/backend-spring
COPY backend-spring/pom.xml .
# 先下载依赖(利用 Docker layer cache)
RUN mvn dependency:go-offline -q

COPY backend-spring/src ./src
RUN mvn clean package -DskipTests -q

FROM rust:1-bookworm@sha256:5e2214abe154fe26e39f64488952e5c991eeed1d6d6da7cc8381ae83927f0cfc AS analyzer-builder

WORKDIR /app/analyzer-rust
COPY analyzer-rust/Cargo.toml analyzer-rust/Cargo.lock ./
COPY analyzer-rust/src ./src
COPY analyzer-rust/tests ./tests
RUN cargo build --release --locked

# Runtime (使用 Ubuntu 基础镜像以兼容 ARM64 / Apple Silicon)
FROM eclipse-temurin:17-jre-jammy@sha256:47c73dc23524b031bed0a5030410c722af6a8b49d4b25898ea8f4615895065f0

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r app && useradd -r -g app -d /home/app -m app
ENV HOME=/home/app

WORKDIR /app
COPY --from=backend-builder /app/backend-spring/target/*.jar app.jar
COPY --from=analyzer-builder /app/analyzer-rust/target/release/sourcelens-analyzer /usr/local/bin/sourcelens-analyzer

RUN chmod +x /usr/local/bin/sourcelens-analyzer \
    && mkdir -p /var/lib/sourcelens/repos /home/app/.config/jgit \
    && chown -R app:app /var/lib/sourcelens/repos /home/app
USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
