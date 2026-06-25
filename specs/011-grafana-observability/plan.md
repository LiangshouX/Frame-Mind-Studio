# Grafana 可观测性集成技术方案

> 最小成本、最快速度实现 Traces + Metrics 可观测性。

## 1. 现状分析

| 维度 | 当前状态 | 说明 |
|------|---------|------|
| OTel 依赖 | ✅ 已有 | `agentscope-core:2.0.0-RC3` 传递引入 `opentelemetry-api` + `opentelemetry-sdk` |
| OtelTracingMiddleware | ❌ 未接入 | 库中已实现，但 `AgentScopeAgentFactory.buildAgent()` 未调用 `.middleware()` |
| Actuator | ⚠️ 部分 | 已引入 `spring-boot-starter-actuator`，但未暴露 Prometheus 端点 |
| OTel 配置 | ❌ 无 | `application.yml` 中无任何 `otel.*` / `management.tracing.*` 配置 |
| Dockerfile | ❌ 无 Agent | `ENTRYPOINT ["java", "-jar", "app.jar"]`，未挂载 OTel Java Agent |
| 可观测后端 | ❌ 无 | docker-compose 中无 Grafana/Tempo/Prometheus/Alloy |

## 2. 方案选型：三条路径对比

| 方案 | 改动量 | Traces | Metrics | 推荐度 |
|------|--------|--------|---------|--------|
| **A. OTel Java Agent (推荐)** | ~0 行代码 | ✅ 自动 | ✅ 自动 | ⭐⭐⭐ |
| B. 手动 SDK + Micrometer | ~50 行代码 | ✅ 手动 | ✅ 手动 | ⭐⭐ |
| C. 仅 Actuator Prometheus | ~5 行配置 | ❌ | ✅ | ⭐ |

**推荐方案 A**：OTel Java Agent 是零代码改动方案。通过 `-javaagent` JVM 参数注入，自动插桩 Spring MVC、JDBC/HikariCP、PostgreSQL Driver、WebSocket 握手、Logback MDC，**无需修改任何 Java 代码**。配合 Grafana + Tempo + Prometheus + Alloy 实现完整可观测。

## 3. 目标架构

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────┐    OTLP/gRPC     ┌───────────┐            │
│  │ Backend  │ ────────────────→ │  Alloy    │            │
│  │ (Java)   │    :4317         │ (Collector)│            │
│  │          │                   └─────┬─────┘            │
│  │ -javaagent│                  ┌─────┴──────┐           │
│  └──────────┘                  ↓             ↓           │
│                          ┌─────────┐  ┌───────────┐     │
│                          │ Tempo   │  │ Prometheus │     │
│                          │ (Traces)│  │ (Metrics)  │     │
│                          └────┬────┘  └─────┬─────┘     │
│                               └──────┬──────┘            │
│                               ┌──────┴──────┐            │
│                               │   Grafana   │            │
│                               │  :3001      │            │
│                               └─────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### 数据流

1. **Traces**: Backend → (OTLP gRPC) → Alloy → Tempo ← Grafana 查询
2. **Metrics**: Backend → (OTLP gRPC) → Alloy → Prometheus ← Grafana 查询
3. **Spring Actuator Metrics**: Backend `/actuator/prometheus` → Prometheus scrape

## 4. 实现步骤

### Phase 1: 后端接入 OTel Agent（0 行代码改动）

#### 4.1 修改 Dockerfile

在 Dockerfile 中下载 OTel Java Agent JAR，并通过 `JAVA_TOOL_OPTIONS` 注入：

```dockerfile
# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 下载 OTel Java Agent（固定版本，确保可复现）
ARG OTEL_VERSION=2.14.0
RUN curl -fsSL -o /app/opentelemetry-javaagent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_VERSION}/opentelemetry-javaagent.jar

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080 9464

# OTel Agent 自动插桩（通过 JAVA_TOOL_OPTIONS 注入）
ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="frame-mind-studio"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://alloy:4317"
ENV OTEL_TRACES_EXPORTER="otlp"
ENV OTEL_METRICS_EXPORTER="otlp, prometheus"
ENV OTEL_LOGS_EXPORTER="none"
ENV OTEL_TRACES_SAMPLER="parentbased_traceidratio"
ENV OTEL_TRACES_SAMPLER_ARG="1.0"
ENV OTEL_RESOURCE_ATTRIBUTES="deployment.environment=docker"

ENTRYPOINT ["java", "-jar", "app.jar"]
```

> **关键点**：`JAVA_TOOL_OPTIONS` 会在 JVM 启动前自动读取，agent 在 `main()` 之前加载，无需改代码。

#### 4.2 启用 Actuator Prometheus 端点

**pom.xml** 新增 1 个依赖：

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

**application.yml** 新增 Actuator 配置：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
```

这会暴露 `GET /actuator/prometheus` 端点，返回 JVM、HikariCP、HTTP 请求等 Micrometer 指标。

#### 4.3 注册 OtelTracingMiddleware（Agent 级 Tracing）

在 `AgentScopeAgentFactory.buildAgent()` 中添加一行：

```java
import io.agentscope.core.tracing.OtelTracingMiddleware;

// 在 ReActAgent.builder() 链中添加：
ReActAgent agent = ReActAgent.builder()
        .name(agentName)
        .sysPrompt(sysPrompt)
        .toolkit(toolkit)
        .maxIters(definition.maxIterations())
        .stateStore(stateStore)
        .model(model)
        .middleware(new OtelTracingMiddleware())  // ← 新增
        .build();
```

> 这让每个 Agent 调用产生结构化的 `invoke_agent` / `chat` / `execute_tool` Span，
> 属性遵循 GenAI 语义约定（`gen_ai.operation.name`, `gen_ai.usage.input_tokens` 等）。
> 当 OTel SDK 未配置时自动短路，零开销。

### Phase 2: 可观测后端（Docker Compose）

#### 4.4 新增 docker-compose 服务

在 `docker-compose.yml` 中添加 4 个服务：

```yaml
  # ─── 可观测性栈 ───
  alloy:
    image: grafana/alloy:v1.7.5
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    volumes:
      - ./observability/config.alloy:/etc/alloy/config.alloy:ro
    command: run --storage.path=/var/lib/alloy/data /etc/alloy/config.alloy
    restart: unless-stopped

  tempo:
    image: grafana/tempo:2.7.1
    ports:
      - "3200:3200"
    command: -config.file=/etc/tempo/config.yml
    volumes:
      - ./observability/tempo.yml:/etc/tempo/config.yml:ro
      - tempo_data:/var/tempo
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:v3.1.0
    ports:
      - "9090:9090"
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:11.4.0
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./observability/provisioning:/etc/grafana/provisioning:ro
    depends_on:
      - tempo
      - prometheus
    restart: unless-stopped
```

更新 volumes 块：

```yaml
volumes:
  postgres_data:
  redis_data:
  tempo_data:
  prometheus_data:
  grafana_data:
```

更新 backend 服务，添加 `depends_on: alloy` 和端口暴露：

```yaml
  backend:
    # ... 现有配置不变 ...
    ports:
      - "8080:8080"
      - "9464:9464"   # OTel Prometheus scrape
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      alloy:
        condition: service_started
```

### Phase 3: 配置文件

#### 4.5 Alloy 配置

创建 `observability/config.alloy`：

```alloy
// 接收 OTLP 数据（来自 OTel Java Agent）
otelcol.receiver.otlp "default" {
  grpc {
    endpoint = "0.0.0.0:4317"
  }
  http {
    endpoint = "0.0.0.0:4318"
  }

  output {
    traces  = [otelcol.processor.batch.default.input]
    metrics = [otelcol.processor.batch.default.input]
  }
}

// 批处理
otelcol.processor.batch "default" {
  output {
    traces  = [otelcol.exporter.otlp.tempo.input]
    metrics = [otelcol.exporter.prometheus.default.input]
  }
}

// 导出 Traces → Tempo
otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo:4317"
  }
}

// 导出 Metrics → Prometheus（remote_write）
otelcol.exporter.prometheus "default" {
  forward_to = [prometheus.remote_write.default.receiver]
}

prometheus.remote_write "default" {
  endpoint {
    url = "http://prometheus:9090/api/v1/write"
  }
}
```

#### 4.6 Tempo 配置

创建 `observability/tempo.yml`：

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
        http:
          endpoint: 0.0.0.0:4318

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/traces
    wal:
      path: /var/tempo/wal

metrics_generator:
  registry:
    external_labels:
      source: tempo
      cluster: docker
  storage:
    path: /var/tempo/generator/wal
    remote_write:
      - url: http://prometheus:9090/api/v1/write
        send_exemplars: true
  traces_storage:
    path: /var/tempo/generator/traces
  processor:
    service_graphs: {}
    span_metrics: {}

overrides:
  defaults:
    metrics_generator:
      processors: [service-graphs, span-metrics]
```

#### 4.7 Prometheus 配置

创建 `observability/prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Spring Boot Actuator / Micrometer 指标
  - job_name: "spring-boot-actuator"
    static_configs:
      - targets: ["backend:8080"]
    metrics_path: "/actuator/prometheus"
    scrape_interval: 10s

  # OTel Agent 暴露的 Prometheus 指标
  - job_name: "otel-agent"
    static_configs:
      - targets: ["backend:9464"]
        labels:
          service: "frame-mind-studio"

  # Tempo 自身指标
  - job_name: "tempo"
    static_configs:
      - targets: ["tempo:3200"]
```

#### 4.8 Grafana 数据源自动配置

创建 `observability/provisioning/datasources/datasources.yml`：

```yaml
apiVersion: 1

datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    isDefault: true
    uid: tempo
    jsonData:
      tracesToLogsV2:
        datasourceUid: loki
      serviceMap:
        datasourceUid: prometheus
      nodeGraph:
        enabled: true
      lokiSearch:
        datasourceUid: loki

  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    uid: prometheus
    isDefault: false
```

> **注意**：如果暂不集成 Loki（日志），可以去掉 `tracesToLogsV2` 和 `lokiSearch` 配置，
> 仅保留 Tempo + Prometheus 两个数据源。

## 5. 开发环境本地运行（非 Docker）

本地开发时，OTel Agent 需要单独下载并配置：

```bash
# 下载 OTel Java Agent
curl -OL https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.14.0/opentelemetry-javaagent.jar

# 启动后端（带 OTel Agent）
cd backend-java
OTEL_SERVICE_NAME=frame-mind-studio \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_TRACES_EXPORTER=otlp \
OTEL_METRICS_EXPORTER=otlp \
OTEL_LOGS_EXPORTER=none \
java -javaagent:../opentelemetry-javaagent.jar -jar target/frame-mind-studio-0.1.0-SNAPSHOT.jar
```

或在 IDE 的 Run Configuration → VM Options 中添加：

```
-javaagent:/path/to/opentelemetry-javaagent.jar
```

## 6. 验证清单

| # | 验证项 | 预期结果 |
|---|--------|---------|
| 1 | `docker-compose up -d` 所有服务启动 | 8 个容器全部 running |
| 2 | 访问 `http://localhost:3001` | Grafana 登录页（admin/admin） |
| 3 | 发起一次 Agent 调用 | Grafana → Tempo → 能看到 `invoke_agent` / `chat` / `execute_tool` span 链 |
| 4 | 访问 `http://localhost:8080/actuator/prometheus` | 返回 Prometheus 格式指标文本 |
| 5 | Grafana → Explore → Prometheus | 能查询 `http_server_requests_seconds_count` 等指标 |
| 6 | Grafana → Explore → Tempo | 能按 Service Name `frame-mind-studio` 搜索 trace |
| 7 | 日志中无 OTel 相关报错 | `OtelTracingMiddleware` 正常注入 |

## 7. 资源开销

| 组件 | 内存开销 | 磁盘开销 | 说明 |
|------|---------|---------|------|
| OTel Java Agent | ~30-50MB JVM 堆外 | ~70MB JAR | 在 backend 容器内 |
| Alloy | ~50-100MB | ~10MB | 轻量级 Collector |
| Tempo | ~100-200MB | 本地存储 | 无索引，极低开销 |
| Prometheus | ~100-200MB | 增长 | 默认 15s 采集间隔 |
| Grafana | ~50-100MB | ~10MB | UI |
| **总计** | **~350-650MB** | ~200MB+ | 开发环境可接受 |

## 8. 后续演进（可选）

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| P1 | 添加 Grafana Dashboard 预置（Agent 调用链路、模型 token 消耗、HTTP 延迟） | 高 |
| P1 | 采样率调整（开发 100% → 生产 10%） | 高 |
| P2 | 集成 Loki 收集日志，实现 trace → log 关联 | 中 |
| P2 | 添加 Alerting 规则（Agent 调用失败率、延迟 P99） | 中 |
| P3 | 自定义 Metrics（Agent token 使用量、模型调用计数） | 低 |
| P3 | OpenTelemetry Collector 替代 Alloy（如果需要更细粒度控制） | 低 |

## 9. 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend-java/Dockerfile` | 修改 | 下载 OTel Agent，设置 JAVA_TOOL_OPTIONS |
| `backend-java/pom.xml` | 修改 | 新增 `micrometer-registry-prometheus` 依赖 |
| `backend-java/src/main/resources/application.yml` | 修改 | 新增 `management.*` 配置 |
| `backend-java/.../AgentScopeAgentFactory.java` | 修改 | 新增 `.middleware(new OtelTracingMiddleware())` |
| `docker-compose.yml` | 修改 | 新增 alloy/tempo/prometheus/grafana 服务 |
| `observability/config.alloy` | **新建** | Alloy Collector 配置 |
| `observability/tempo.yml` | **新建** | Tempo 配置 |
| `observability/prometheus.yml` | **新建** | Prometheus 配置 |
| `observability/provisioning/datasources/datasources.yml` | **新建** | Grafana 数据源自动配置 |

**Java 代码改动：1 行**（`AgentScopeAgentFactory` 加 `.middleware()`）
**配置文件：4 个新建 + 4 个修改**
**新增 Docker 容器：4 个**
