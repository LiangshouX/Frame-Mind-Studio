# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (layer caching)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 下载 OTel Java Agent（固定版本，确保可复现）
ARG OTEL_VERSION=2.14.0
RUN apk add --no-cache curl && \
    curl -fsSL -o /app/opentelemetry-javaagent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_VERSION}/opentelemetry-javaagent.jar && \
    apk del curl

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080 9464

# OTel Agent 自动插桩（通过 JAVA_TOOL_OPTIONS 注入）
ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="frame-mind-studio"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://alloy:4317"
ENV OTEL_TRACES_EXPORTER="otlp"
ENV OTEL_METRICS_EXPORTER="otlp,prometheus"
ENV OTEL_LOGS_EXPORTER="none"
ENV OTEL_TRACES_SAMPLER="parentbased_traceidratio"
ENV OTEL_TRACES_SAMPLER_ARG="1.0"
ENV OTEL_RESOURCE_ATTRIBUTES="deployment.environment=docker"

ENTRYPOINT ["java", "-jar", "app.jar"]
