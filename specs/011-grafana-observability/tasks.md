# Tasks: Grafana 可观测性集成

## Phase 1: 后端接入 OTel Agent

- [X] **T1** 修改 `backend-java/Dockerfile` — 下载 OTel Java Agent，设置 JAVA_TOOL_OPTIONS 和 OTEL_* 环境变量
- [X] **T2** 修改 `backend-java/pom.xml` — 新增 `micrometer-registry-prometheus` 依赖
- [X] **T3** 修改 `backend-java/src/main/resources/application.yml` — 新增 `management.*` Actuator 配置
- [X] **T4** 修改 `backend-java/.../AgentScopeAgentFactory.java` — 注册 `.middleware(new OtelTracingMiddleware())`

## Phase 2: 可观测后端配置文件

- [X] **T5** 创建 `observability/config.alloy` — Alloy Collector 配置（OTLP 接收 → Tempo/Prometheus 导出）
- [X] **T6** 创建 `observability/tempo.yml` — Tempo 配置（本地存储 + metrics_generator）
- [X] **T7** 创建 `observability/prometheus.yml` — Prometheus 配置（scrape actuator + otel-agent + tempo）
- [X] **T8** 创建 `observability/provisioning/datasources/datasources.yml` — Grafana 数据源自动配置

## Phase 3: Docker Compose 集成

- [X] **T9** 修改 `docker-compose.yml` — 新增 alloy/tempo/prometheus/grafana 服务 + 更新 backend 和 volumes

## Phase 4: 验证

- [ ] **T10** 验证 Docker 构建和启动 — `docker-compose build backend` 成功
- [ ] **T11** 验证全栈启动 — `docker-compose up -d` 所有容器 healthy
- [ ] **T12** 验证 Grafana 可访问 — `http://localhost:3001` 登录页
- [ ] **T13** 验证 Actuator Prometheus 端点 — `http://localhost:8080/actuator/prometheus` 返回指标
- [ ] **T14** 验证 Trace 数据流 — Agent 调用后 Grafana Tempo 能搜索到 span

> T10-T14 需要 Docker 环境运行验证，待用户手动执行。
