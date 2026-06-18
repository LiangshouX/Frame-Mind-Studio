# 灵镜创影 (FrameMind Studio) 产品设计规格书 V1.0

> **版本**: V1.0 · **日期**: 2026-06-15 · **状态**: 初始发布
> **产品名称**: 灵镜创影 (FrameMind Studio)
> **产品类型**: 开源、自托管、AI 驱动的一站式微电影/短剧/漫剧制作平台
> **许可协议**: Apache 2.0

---

## PART I — 产品总览 (Product Overview)

### 1.1 文档说明

本规格书是「灵镜创影 (FrameMind Studio)」的核心产品设计文档，定义了平台全部功能模块的详细设计、技术架构、数据模型、API
接口和开发路线图。

**文档读者**：

- 产品负责人 — 理解功能全貌与优先级
- 前端/后端工程师 — 依据数据模型与 API 规范进行开发
- AI/算法工程师 — 理解 Agent 系统与 Pipeline 设计
- 设计师 — 依据 UI/UX 规范进行界面设计
- 开源社区贡献者 — 快速了解项目架构与参与方式

**版本历史**：

| 版本   | 日期         | 变更说明                               |
|:-----|:-----------|:-----------------------------------|
| V1.0 | 2026-06-15 | 初始发布，覆盖全部 8 大功能模块、技术架构、数据模型、API 设计 |

### 1.2 产品定位与愿景

**灵镜创影** 是一个面向个人创作者和小型团队的 **AI 原生影视创作平台**。平台以 **AI Agent** 为创意大脑，结合多模态 AI
技术，提供从"灵感孵化 → 剧本创作 → 分镜设计 → 形象生成 → 视频合成 → 音频制作 → 成片导出"的端到端全链路闭环。

**核心定位**：

- **开源自托管**：全部源码开源 (Apache 2.0)，用户通过 Docker Compose 一键部署到本地或私有服务器
- **自配 API Key**：用户自行申请并配置各 AI 服务的 API Key（LLM、TTS、图像生成、视频生成等），系统按需调用
- **零平台依赖**：不依赖任何中心化 SaaS 平台，数据完全存储在用户自己的服务器上
- **AI Agent 驱动**：不是简单的工具拼接，而是由多个专业 AI Agent 协作完成创作任务

**愿景**：让每一个有故事想法的人，都能用 AI 创作出精良的影视作品。

### 1.3 目标用户画像

| 用户角色         | 典型场景          | 核心诉求          | 技术能力 |
|:-------------|:--------------|:--------------|:-----|
| **独立创作者**    | 个人自媒体短剧、漫剧    | 低门槛、快速出片、创意激发 | 低-中  |
| **MCN 机构编剧** | 批量生产竖屏短剧      | 效率提升、爆款公式复用   | 中    |
| **影视工作室**    | 网络电影前期策划、分镜预演 | 专业级输出、IP 保护   | 中-高  |
| **网文作者**     | 小说可视化、有声书     | 快速将文字转化为视觉内容  | 低    |
| **教育培训**     | 影视编剧教学        | 案例演示、学生作品批改   | 低-中  |
| **技术爱好者**    | 自部署、二次开发      | 开源可控、可扩展      | 高    |

### 1.4 核心价值主张

1. **🧠 Agent 驱动的创意引擎**：基于 DeepAgents 框架的多智能体编剧室，具备长期记忆、工具链调用和专家技能，实现真正的"
   人机共创"
2. **🔗 全链路闭环与资产强一致**：打通文本到成片，通过 R2V 技术解决角色跨镜头变脸痛点
3. **🌐 多模型路由与灵活接入**：通过 Catalog 机制无缝接入全球主流大模型，用户按需配置
4. **📊 数据驱动的创作决策**：Agent 集成分析工具，用数据指导创意
5. **🎬 双模式输出**：同时支持"漫剧模式"（动态漫画）和"短剧模式"（真人短片风格），覆盖主流短视频内容形态
6. **🔓 数据主权**：所有数据存储在用户自己的服务器，完全可控

### 1.5 全链路 Pipeline 总览

灵镜创影的核心创作流程遵循影视工业标准，分为六大阶段：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    灵镜创影 全链路 Pipeline                          │
├─────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ ① 剧本  │ ② 分镜   │ ③ 形象   │ ④ 视频   │ ⑤ 音频   │ ⑥ 包装导出  │
│ ScriptMind│Storyboard│StyleForge│MotionCore│VoiceStage│  Export     │
│         │  AI      │          │          │+SoundGen │              │
├─────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤
│ 一句话/  │ 自动拆解  │ 角色立绘  │ 漫剧模式  │ TTS配音   │ MP4/MOV     │
│ 大纲/    │ 镜头语言  │ 场景背景  │ 动态漫画  │ 语音克隆  │ 16:9 / 9:16│
│ 小说导入  │ 景别机位  │ 风格模板  │ 短剧模式  │ BGM匹配   │ 720p~4K    │
│ AI扩写   │ 运镜转场  │ 一致性锁  │ I2V/T2V  │ 音效叠加  │ 字幕导出   │
│ 角色提取  │ 可视化板  │ 资产管理  │ 口型同步  │ 自动混音  │ 批量导出   │
└─────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
     │           │          │          │          │          │
     ▼           ▼          ▼          ▼          ▼          ▼
  [LLM Agent]  [LLM+规则] [图像生成]  [视频生成]  [TTS+BGM]  [FFmpeg]
```

**Pipeline 数据流**：

1. **ScriptMind** 接收用户输入（一句话/大纲/小说），通过 AI Agent 协作生成结构化剧本，自动提取角色信息
2. **StoryboardAI** 将剧本每场自动拆解为多个镜头，推断景别、机位、运镜，生成可视化分镜板
3. **StyleForge** 基于角色描述和场景描述生成视觉资产（角色立绘、场景背景），锁定角色面部一致性
4. **MotionCore** 根据分镜和视觉资产生成视频片段（漫剧模式：图层动画；短剧模式：I2V/T2V）
5. **VoiceStage + SoundGen** 生成对白配音、旁白、BGM、音效，自动混音并对齐到时间线
6. **Export** 将所有素材合成为最终视频，支持多种分辨率和格式导出

### 1.6 核心术语表

| 术语         | 英文                   | 说明                        |
|:-----------|:---------------------|:--------------------------|
| 灵镜创影       | FrameMind Studio     | 本产品名称                     |
| 剧本工厂       | ScriptMind           | 剧本创作模块                    |
| 形象工坊       | StyleForge           | 角色与场景视觉设计模块               |
| 智能分镜       | StoryboardAI         | AI 分镜生成模块                 |
| 视频合成引擎     | MotionCore           | 视频生成与合成模块                 |
| 声演剧场       | VoiceStage           | 语音合成与配音模块                 |
| 音效智选       | SoundGen             | BGM 与音效管理模块               |
| Agent      | AI Agent             | 具备自主决策能力的 AI 智能体          |
| Pipeline   | 生产管线                 | 从输入到输出的自动化处理流程            |
| R2V        | Reference-to-Video   | 参考图驱动的视频生成，保持角色一致性        |
| I2V        | Image-to-Video       | 图像到视频的生成方式                |
| T2V        | Text-to-Video        | 文本到视频的生成方式                |
| FaceID     | 面部特征 ID              | 用于锁定角色面部一致性的特征向量          |
| TTS        | Text-to-Speech       | 文本转语音技术                   |
| SFX        | Sound Effects        | 音效                        |
| BGM        | Background Music     | 背景音乐                      |
| LLM        | Large Language Model | 大语言模型                     |
| HITL       | Human-in-the-Loop    | 人类审核节点，Agent 工作流中的人工干预机制  |
| DeepAgents | -                    | 基于 LangGraph 的 Agent 编排框架 |
| ChromaDB   | -                    | 轻量级嵌入式向量数据库               |
| Celery     | -                    | Python 异步任务队列             |

### 1.7 文档约定与符号规范

- **中文优先**：正文使用中文，技术术语保留英文原文
- **模块命名**：使用英文模块名 + 中文副标题，如「ScriptMind 剧本工厂」
- **代码块**：JSON Schema、SQL DDL、Python 伪代码使用 fenced code block
- **表格**：功能对比、API 端点、数据模型使用 Markdown 表格
- **层级**：PART → 章节 (X.Y) → 子章节 (X.Y.Z)
- **Mermaid 图**：流程图、架构图使用 Mermaid 语法（在支持的渲染器中可渲染）
- **⚠️ 标记**：重要注意事项
- **✅ / ❌ 标记**：功能包含/不包含说明

---

## PART II — AI Agent 系统设计 (AI Agent System)

### 2.1 Agent 框架架构

#### 2.1.1 框架选型：DeepAgents (LangChain)

灵镜创影采用 **DeepAgents** 作为核心 Agent 编排框架。DeepAgents 是 LangChain 生态中面向深度自主 Agent 的框架，基于
LangGraph 构建。

**框架对比决策**：

| 对比维度              | DeepAgents (LangChain) | AutoGen (Microsoft) | CrewAI      |
|:------------------|:-----------------------|:--------------------|:------------|
| 核心架构              | 基于 LangGraph 状态图       | 对话驱动多 Agent         | 角色驱动多 Agent |
| 状态管理              | ✅ 原生状态机 + 检查点          | ⚠️ 基于对话历史           | ⚠️ 较简单      |
| Human-in-the-Loop | ✅ 原生支持                 | ⚠️ 需自行实现            | ⚠️ 需自行实现    |
| 工具生态              | ✅ LangChain 生态（丰富）     | ✅ 支持自定义工具           | ✅ 支持自定义工具   |
| 记忆抽象              | ✅ 内置 Memory 抽象         | ⚠️ 需自行实现            | ⚠️ 基础支持     |
| 流式输出              | ✅ 原生支持                 | ⚠️ 部分支持             | ❌ 有限        |
| 调试工具              | ✅ LangSmith 集成         | ✅ AutoGen Studio    | ⚠️ 有限       |
| 适合场景              | 复杂状态流、长任务              | 对话式协作               | 简单角色分工      |

**选型结论**：DeepAgents 在状态管理、HITL、记忆抽象和调试工具方面最为成熟，最适合灵镜创影这种需要复杂状态流转、人类审核节点和长期记忆的创作场景。

**关键依赖**：

```
langchain>=0.3.0
langchain-core>=0.3.0
langchain-openai>=0.2.0
langchain-community>=0.3.0
langgraph>=0.2.0
langsmith>=0.2.0
```

#### 2.1.2 StateGraph 编排模型

Agent 系统基于有向图（StateGraph）进行编排，每个 Agent 是图中的一个节点，边定义了流转规则：

```
DeepAgents StateGraph
├── nodes:
│   ├── "showrunner"       → 主笔 Agent（大纲/主线/节奏）
│   ├── "world_builder"    → 设定 Agent（世界观/场景）
│   ├── "character_design" → 角色 Agent（人物/关系/台词）
│   ├── "script_doctor"    → 审稿 Agent（逻辑/冲突/优化）
│   ├── "human_review"     → 人类审核节点（HITL）
│   ├── "memory_retrieval" → 记忆检索节点（RAG）
│   └── "output_formatter" → 输出格式化节点
├── edges:
│   ├── showrunner → world_builder → character_design → script_doctor
│   ├── script_doctor → [pass] → output_formatter
│   ├── script_doctor → [needs_revision] → showrunner（循环）
│   ├── showrunner → human_review（关键决策点）
│   └── human_review → [approved] → output_formatter
│   └── human_review → [revise] → showrunner
└── state:
    ├── story_outline: StoryOutline
    ├── world_setting: WorldSetting
    ├── characters: List[Character]
    ├── script_drafts: List[ScriptDraft]
    ├── review_feedback: List[ReviewFeedback]
    └── memory_context: MemoryContext
```

### 2.2 多智能体协作架构

#### 2.2.1 Agent 角色定义

| Agent                 | 名称    | 职责             | 核心能力             |
|:----------------------|:------|:---------------|:-----------------|
| **Showrunner**        | 主笔编剧  | 把控故事主线、节奏和主题   | 三幕剧结构、黄金三章、救猫咪节拍 |
| **WorldBuilder**      | 设定架构师 | 构建世界观、场景、逻辑自洽性 | 时代背景、社会结构、设定冲突检测 |
| **CharacterDesigner** | 角色设计师 | 设计角色档案、关系网、弧光  | 性格弧光、人物关系、台词风格   |
| **ScriptDoctor**      | 审稿医生  | 校验逻辑、节奏、台词质量   | 逻辑校验、节奏分析、伏笔管理   |

#### 2.2.2 Agent 协作流程

```
用户输入: "写一个现代都市复仇短剧，女主被渣男背叛后逆袭"

Step 1: Showrunner Agent 接收意图
  ├── 解析: 题材=都市复仇, 节奏=快节奏, 目标=竖屏短剧
  ├── 检索 ChromaDB: 同类题材爆款结构模式
  └── 输出: 大纲草案（含集数、主线、反转点）

Step 2: WorldBuilder Agent 构建设定
  ├── 基于大纲构建世界观设定
  ├── 生成 Story Bible（设定集）
  ├── 存入 ChromaDB（项目记忆）
  └── 输出: 世界观文档 + 场景清单

Step 3: CharacterDesigner Agent 设计角色
  ├── 基于大纲和世界观设计角色
  ├── 生成角色卡片（外貌/性格/关系/弧光）
  ├── 存入 Neo4j（关系图谱）
  └── 输出: 角色档案集

Step 4: ScriptDoctor Agent 审校
  ├── 校验: 逻辑一致性、节奏合理性、角色行为动机
  ├── 检索 ChromaDB: 伏笔是否回收、设定是否冲突
  └── 输出: 审校报告 + 修改建议

Step 5: Showrunner Agent 整合定稿
  ├── 综合各方反馈修改
  ├── 生成最终剧本
  └── 输出: 标准格式剧本 JSON
```

#### 2.2.3 冲突仲裁机制

当多个 Agent 对同一内容产生分歧时，系统通过以下规则仲裁：

1. **专业优先**：角色设计分歧以 CharacterDesigner 为准，世界观分歧以 WorldBuilder 为准
2. **审稿否决权**：ScriptDoctor 对逻辑硬伤拥有否决权，可要求回退重写
3. **人类终审**：所有重大分歧最终由人类用户在 HITL 节点裁决
4. **投票机制**：非关键分歧采用 3/4 多数投票

### 2.3 三层记忆系统

| 层级       | 存储介质                      | 数据类型                  | 生命周期 | 检索方式             |
|:---------|:--------------------------|:----------------------|:-----|:-----------------|
| **工作记忆** | 内存 (LangChain ChatMemory) | 当前对话上下文               | 会话级  | 直接拼接             |
| **项目记忆** | ChromaDB (向量数据库)          | 剧本 chunks、设定集、角色档案、伏笔 | 项目级  | 语义检索 (Embedding) |
| **全局记忆** | Neo4j (图数据库) + ChromaDB   | 人物关系图谱、用户偏好、跨项目设定     | 永久   | 图查询 + 语义检索       |

**ChromaDB 项目记忆 Collection Schema**：

```python
# 1. 设定集 (Story Bible)
story_bible_collection.add(
    documents=["世界观: 2024年现代都市，科技公司林立..."],
    metadatas=[{
        "project_id": "proj_001",
        "type": "world_setting",
        "category": "time_period",
        "importance": "high",
        "episode_range": "1-20",
    }],
    ids=["setting_001"]
)

# 2. 角色档案
character_collection.add(
    documents=["林晚秋: 28岁，互联网公司产品经理，外表温柔但内心坚韧..."],
    metadatas=[{
        "project_id": "proj_001",
        "type": "character",
        "character_id": "char_001",
        "character_name": "林晚秋",
        "importance": "high",
    }],
    ids=["char_001_desc"]
)

# 3. 伏笔记录
foreshadow_collection.add(
    documents=["第1集伏笔: 晚秋在公司电梯里捡到一枚刻有'LQ'的戒指"],
    metadatas=[{
        "project_id": "proj_001",
        "type": "foreshadow",
        "planted_episode": 1,
        "resolved": False,
        "resolved_episode": None,
        "related_characters": ["林晚秋"],
    }],
    ids=["foreshadow_001"]
)
```

**Neo4j 关系图谱模型**：

```cypher
// 节点
(:Character {id, name, role_type, personality_tags, avatar_url})
(:Project {id, name, genre, created_at})

// 关系
(char1:Character)-[:LOVES {intensity: 8, start_ep: 5}]->(char2:Character)
(char1:Character)-[:BETRAYS {reason: "商业利益", episode: 3}]->(char2:Character)
(char1:Character)-[:FRIEND_OF {since: "大学"}]->(char2:Character)
(char:Character)-[:BELONGS_TO]->(project:Project)
```

### 2.4 工具调用体系

#### 2.4.1 工具注册表

| 工具名称                 | 功能描述          | 调用场景          | 接口类型         |
|:---------------------|:--------------|:--------------|:-------------|
| `web_search`         | 联网搜索资料        | 查证历史细节、搜索热梗   | REST API     |
| `visual_inspiration` | 调用生图模型生成概念图   | 关键场景可视化       | Async API    |
| `logic_checker`      | 逻辑/时间线校验      | 悬疑剧本诡计验证      | Internal     |
| `format_converter`   | 剧本格式转换        | 自然语言 → 标准剧本格式 | Internal     |
| `memory_retrieve`    | ChromaDB 语义检索 | 检索设定、伏笔、历史剧情  | ChromaDB API |
| `memory_store`       | ChromaDB 写入   | 存储新设定、剧情摘要    | ChromaDB API |
| `graph_query`        | Neo4j 图查询     | 查询人物关系、关系链    | Neo4j API    |

#### 2.4.2 错误处理与降级策略

```python
class ToolExecutionPolicy:
    max_retries: int = 3
    timeout_seconds: int = 30
    fallback_strategy: str = "skip_with_warning"

    degradation_map = {
        "web_search": "使用缓存结果或跳过，告知用户",
        "visual_inspiration": "跳过概念图，纯文本继续",
        "logic_checker": "标记为未校验，人工确认",
        "memory_retrieve": "使用工作记忆上下文替代",
    }
```

### 2.5 专家技能树

每个 Skill 封装为一个 **Prompt Template + 输出 Schema + 校验规则** 的组合：

```python
class Skill:
    name: str  # 技能名称
    description: str  # 技能描述
    prompt_template: str  # Prompt 模板
    output_schema: dict  # 输出 JSON Schema
    validation_rules: list  # 校验规则
    applicable_genres: list  # 适用题材
    example_input: str  # 示例输入
    example_output: str  # 示例输出
```

**技能库清单**：

| 技能分类     | 技能名称   | 适用题材     | 核心方法论              |
|:---------|:-------|:---------|:-------------------|
| **结构技能** | 三幕剧结构  | 通用       | 好莱坞经典三幕式           |
|          | 救猫咪节拍  | 通用       | Save the Cat 15 节拍 |
|          | 黄金三章   | 都市/玄幻/重生 | 网文开局受辱-觉醒-打脸       |
|          | 倒叙开局   | 悬疑/推理    | 先展示结果，再回溯过程        |
| **题材技能** | 悬疑推理   | 悬疑/推理    | 倒推法 + 线索管理表        |
|          | 甜宠拉扯   | 甜宠/言情    | 情感升温曲线 + 误会-和好循环   |
|          | 复仇爽文   | 都市/古代    | 压迫积累 + 分级打脸 + 终极反转 |
|          | 重生逆袭   | 重生/穿越    | 信息差利用 + 蝴蝶效应链      |
| **格式技能** | 标准剧本格式 | 通用       | 场景-动作-台词 JSON      |
|          | 分镜预描述  | 通用       | 为每个镜头生成画面 Prompt   |

### 2.6 Prompt Engineering 规范

#### 2.6.1 Showrunner Agent System Prompt 模板

```
你是灵镜创影的主笔编剧 (Showrunner)。

## 身份与职责
你是一位经验丰富的短剧/网文编剧总监，擅长把控故事主线、节奏和主题。
你的目标是创作出"开局抓人、中段紧凑、结尾有余味"的优质剧本。

## 工作流程
1. 接收用户的创作意图（题材、风格、时长、集数等）
2. 调用记忆系统检索相关的设定和历史偏好
3. 生成故事大纲（含集数规划、主线脉络、关键反转点）
4. 将大纲提交给其他 Agent 协作完善
5. 根据反馈迭代修改

## 输出格式
严格按照 StoryOutline JSON Schema 输出，必须包含：
- title: 标题
- genre: 题材标签列表
- logline: 一句话梗概
- episodes: 集数规划列表
- main_plot_points: 主线剧情点
- turning_points: 关键反转点

## 约束
- 短剧每集时长 1-3 分钟，总集数 8-100 集
- 前 3 集必须完成核心冲突建立和"钩子"设置
- 每集结尾必须有悬念或反转
```

#### 2.6.2 输出格式约束

所有 Agent 输出必须符合预定义的 JSON Schema，通过 LangChain 的 `with_structured_output()` 方法强制约束：

```python
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Optional


class StoryOutline(BaseModel):
    title: str = Field(description="故事标题")
    genre: List[str] = Field(description="题材标签列表")
    logline: str = Field(description="一句话梗概")
    episodes: List[OutlineEpisode] = Field(description="集数规划")
    main_plot_points: List[str] = Field(description="主线剧情点")
    turning_points: List[str] = Field(description="关键反转点")
    themes: List[str] = Field(description="主题标签")


class OutlineEpisode(BaseModel):
    episode_number: int = Field(description="集数编号")
    title: str = Field(description="集标题")
    summary: str = Field(description="剧情摘要")
    key_events: List[str] = Field(description="关键事件")
    cliffhanger: str = Field(description="结尾钩子")
```

### 2.7 Human-in-the-Loop 机制

Agent 工作流中设置关键人类审核节点：

| 审核节点     | 触发时机                     | 用户可选操作           |
|:---------|:-------------------------|:-----------------|
| **大纲审核** | Showrunner 生成大纲后         | 批准 / 要求修改 / 手动编辑 |
| **角色审核** | CharacterDesigner 输出角色卡后 | 批准 / 调整设定 / 手动编辑 |
| **剧本审核** | ScriptDoctor 审校完成后       | 批准 / 要求重写 / 手动修改 |
| **分歧裁决** | Agent 间产生冲突时             | 选择立场 / 提供新方向     |

**实现方式**：利用 DeepAgents 的 `interrupt()` 原语，在 StateGraph 中插入人类审核节点。Agent 执行到审核节点时自动暂停，等待用户通过
WebSocket 反馈后恢复执行。

### 2.8 AI 模型 Catalog 路由

#### 2.8.1 多模型接入配置

系统通过 AI Gateway 层统一路由到不同 LLM 提供商：

```python
class ModelCatalog:
    """AI 模型目录 — 用户通过设置页配置 API Key"""

    models = {
        "qwen-max": {
            "provider": "alibaba",
            "endpoint": "https://dashscope.aliyuncs.com",
            "use_case": "主力创作模型，中文能力强",
            "max_tokens": 8192,
        },
        "gpt-4o": {
            "provider": "openai",
            "endpoint": "https://api.openai.com/v1",
            "use_case": "复杂推理、英文场景",
            "max_tokens": 16384,
        },
        "claude-sonnet-4-6": {
            "provider": "anthropic",
            "endpoint": "https://api.anthropic.com",
            "use_case": "长文本分析、审稿",
            "max_tokens": 8192,
        },
        "deepseek-v3": {
            "provider": "deepseek",
            "endpoint": "https://api.deepseek.com",
            "use_case": "高性价比备选",
            "max_tokens": 8192,
        },
    }
```

#### 2.8.2 API Key 管理机制

- 用户在设置页配置各提供商的 API Key
- API Key 使用 Fernet 对称加密存储在本地 PostgreSQL
- 前端不暴露完整 Key，仅显示后 4 位
- 系统启动时解密 Key 并注入环境变量

#### 2.8.3 模型降级与回退策略

```
首选模型调用 → 成功 → 返回结果
             → 失败 → 重试（最多 3 次）
                    → 降级到备选模型
                    → 全部失败 → 通知用户，使用缓存结果或暂停任务
```

---

## PART III — ScriptMind 剧本工厂

### 3.1 功能概述与用户场景

ScriptMind 是灵镜创影的创作起点，负责将用户的创意想法转化为结构化的标准剧本。

**核心用户场景**：

| 场景        | 输入方式           | 期望输出       |
|:----------|:---------------|:-----------|
| "我有个点子"   | 一句话梗概          | 完整大纲 + 角色表 |
| "我有大纲了"   | 多段大纲文本         | 细化为标准剧本    |
| "我有现成小说"  | 导入 txt/docx 文件 | 自动改编为剧本格式  |
| "网上看到个故事" | 输入 URL         | 抓取内容并改编为剧本 |
| "帮我改改这段"  | 选中剧本段落         | AI 优化建议    |

### 3.2 创意输入与意图解析

#### 3.2.1 输入方式

**① 一句话梗概**
用户输入一句话描述，如"写一个现代都市复仇短剧，女主被渣男背叛后逆袭"。

- Agent 解析：题材、核心冲突、目标形态（短剧/漫剧/微电影）
- 自动生成：StoryOutline 大纲

**② 多段大纲**
用户粘贴已有大纲文本，系统解析为结构化 OutlineEpisode 列表。

- 支持 Markdown 格式大纲
- 支持编号列表格式
- 自动识别集数、关键事件、钩子

**③ 全文小说/剧本导入**
支持文件格式：

- `.txt` — 纯文本，按章节自动分割
- `.docx` — Word 文档，保留格式信息
- `.md` — Markdown 格式
- `.fountain` — Fountain 剧本格式（专业编剧软件通用）

导入流程：

1. 文件解析 → 提取纯文本
2. LLM 分析 → 识别章节/场景边界
3. 结构化转换 → 生成 ScriptContent JSON
4. 角色提取 → 自动识别所有角色
5. 用户确认 → HITL 审核节点

**④ URL 抓取**
输入网页 URL，系统自动：

1. 抓取页面正文内容
2. 过滤广告/导航等噪声
3. 提取故事文本
4. 进入标准导入流程

#### 3.2.2 意图解析

Showrunner Agent 解析用户输入后，提取以下结构化意图：

```json
{
  "genre": [
    "都市",
    "复仇",
    "逆袭"
  ],
  "format": "short_drama",
  "target_episodes": 20,
  "target_duration_minutes": 2.5,
  "tone": "快节奏",
  "core_conflict": "女主被男友和闺蜜联手背叛后逆袭",
  "audience": "18-35岁女性"
}
```

### 3.3 大纲生成流程

#### 3.3.1 Agent 协作流程

```
用户输入意图
    │
    ▼
┌─────────────┐
│ Showrunner  │ → 生成故事大纲草案
│ (主笔编剧)  │   含集数规划、主线、反转点
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ WorldBuilder│ → 构建世界观设定
│ (设定架构师) │   生成 Story Bible
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Character    │ → 设计角色档案
│ Designer     │   外貌/性格/关系/弧光
│ (角色设计师) │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ ScriptDoctor│ → 审校大纲
│ (审稿医生)  │   逻辑/节奏/冲突校验
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Human Review│ → 用户审核
│ (人类审核)  │   批准/修改/重来
└──────┬──────┘
       │
       ▼
   大纲定稿
```

#### 3.3.2 风格预设

系统内置多种剧本风格预设，用户可一键选择：

| 风格预设 | 适用题材  | 核心特征                 |
|:-----|:------|:---------------------|
| 甜宠   | 言情/都市 | 情感升温曲线、误会-和好循环、撒糖密度高 |
| 悬疑   | 推理/惊悚 | 线索埋设、反转叠加、逻辑闭环       |
| 逆袭   | 都市/玄幻 | 压迫积累、分级打脸、终极反转       |
| 古风   | 古装/仙侠 | 古典意境、权谋斗争、恩怨情仇       |
| 漫威风  | 科幻/超英 | 世界观宏大、视觉奇观、英雄弧光      |
| 搞笑   | 喜剧/日常 | 节奏明快、反差萌、梗密度高        |

#### 3.3.3 冲突与节奏优化

ScriptDoctor Agent 自动检测剧本中的节奏问题：

- **平淡点检测**：分析每个 Scene 的情绪强度，标记连续低强度区间
- **钩子检查**：验证每集结尾是否有悬念或反转
- **爽感密度**：计算"打脸/逆袭/甜蜜"等高情绪点的分布频率
- **建议生成**：针对薄弱环节，自动生成"增加反转""强化冲突""插入回忆杀"等建议

### 3.4 剧本结构化数据模型

#### 3.4.1 层级结构

```
Script (剧本)
├── ScriptContent
│   ├── title: string
│   ├── totalEpisodes: number
│   └── episodes: ScriptEpisode[]
│       ├── episodeNumber: number
│       ├── title: string
│       ├── durationMinutes: number
│       └── scenes: ScriptScene[]
│           ├── sceneId: string
│           ├── location: string
│           ├── time: string
│           ├── moodTags: string[]
│           ├── charactersPresent: string[]
│           └── beats: ScriptBeat[]
│               ├── beatId: string
│               ├── type: "action" | "dialogue" | "emotion" | "transition"
│               ├── content: string
│               ├── character: string (对白角色)
│               ├── emotion: string (情绪标注)
│               ├── cameraSuggestion: string (镜头建议)
│               └── durationSeconds: number
```

#### 3.4.2 JSON Schema 完整定义

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "剧本标题"
    },
    "totalEpisodes": {
      "type": "integer",
      "description": "总集数"
    },
    "episodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "episodeNumber": {
            "type": "integer"
          },
          "title": {
            "type": "string"
          },
          "durationMinutes": {
            "type": "number"
          },
          "scenes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "sceneId": {
                  "type": "string"
                },
                "location": {
                  "type": "string"
                },
                "time": {
                  "type": "string"
                },
                "moodTags": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "charactersPresent": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "beats": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "beatId": {
                        "type": "string"
                      },
                      "type": {
                        "type": "string",
                        "enum": [
                          "action",
                          "dialogue",
                          "emotion",
                          "transition"
                        ]
                      },
                      "content": {
                        "type": "string"
                      },
                      "character": {
                        "type": "string"
                      },
                      "emotion": {
                        "type": "string"
                      },
                      "cameraSuggestion": {
                        "type": "string"
                      },
                      "durationSeconds": {
                        "type": "number"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 3.5 剧本编辑器设计

#### 3.5.1 编辑器元素类型

剧本编辑器采用专业剧本格式，支持六种元素类型：

| 元素类型            | 样式             | 快捷操作 |
|:----------------|:---------------|:-----|
| `scene_heading` | 等宽字体、大写、左侧红色边框 | 场景标题 |
| `action`        | 正文字体、1.7 行高    | 动作描述 |
| `character`     | 等宽字体、居中、大写     | 角色名  |
| `dialogue`      | 居中、60% 宽度      | 对白内容 |
| `parenthetical` | 斜体、居中、50% 宽度   | 括号说明 |
| `transition`    | 等宽字体、右对齐       | 转场标记 |

#### 3.5.2 交互规范

| 操作                  | 效果                                                                                   |
|:--------------------|:-------------------------------------------------------------------------------------|
| **Tab**             | 循环切换元素类型（scene_heading → action → character → dialogue → parenthetical → transition） |
| **Shift+Tab**       | 反向切换元素类型                                                                             |
| **Enter**           | 在当前元素后新建段落（对白后默认 action，角色后默认 dialogue）                                              |
| **Backspace**（空内容时） | 删除当前元素，焦点移到上一个                                                                       |
| **↑/↓**             | 在元素间导航，光标到首尾时切换                                                                      |

#### 3.5.3 场景编号

左侧边栏自动显示场景编号（仅 `scene_heading` 类型显示），编号随编辑自动更新。

### 3.6 多集连续剧管理

#### 3.6.1 集数规划

- 支持 8-100 集的短剧，每集 1-3 分钟
- AI 自动规划每集的核心事件和钩子
- 用户可拖拽调整集数顺序
- 支持合并/拆分集

#### 3.6.2 伏笔管理

系统自动追踪伏笔的生命周期：

```json
{
  "foreshadow_id": "f001",
  "content": "晚秋在公司电梯里捡到一枚刻有'LQ'的戒指",
  "planted_episode": 1,
  "resolved": false,
  "resolved_episode": null,
  "related_characters": [
    "林晚秋"
  ],
  "importance": "high"
}
```

ScriptDoctor Agent 在每次审校时检查：

- 已埋伏笔是否在后续集数中回收
- 回收方式是否合理
- 是否有未回收的伏笔遗漏到结局

### 3.7 版本控制与历史记录

- 每次 AI 修改或手动编辑自动创建版本快照
- 支持任意版本回溯和对比（diff 视图）
- 版本历史存储在 PostgreSQL `scripts` 表的 `version` 字段
- 大版本支持分支（实验性功能）

### 3.8 剧本质量评估指标

| 指标         | 计算方式                 | 目标值         |
|:-----------|:---------------------|:------------|
| **钩子强度**   | 每集结尾是否有悬念标记          | 100%        |
| **节奏曲线**   | 情绪强度的标准差             | > 0.3（避免平淡） |
| **角色出场均衡** | 主角出场占比               | 40%-60%     |
| **对白占比**   | 对白 beat 数 / 总 beat 数 | 30%-50%     |
| **场景多样性**  | 不同场景数 / 总场景数         | > 0.6       |

---

## PART IV — StoryboardAI 智能分镜

### 4.1 功能概述与用户场景

StoryboardAI 将结构化剧本自动转化为可视化分镜板，是连接"文字创作"与"视觉制作"的关键桥梁。

**核心用户场景**：

| 场景   | 输入                   | 输出           |
|:-----|:---------------------|:-------------|
| 自动分镜 | 完整剧本 (ScriptContent) | 全部分镜卡片 + 时间轴 |
| 手动调整 | 拖拽调整镜头顺序/参数          | 更新后的分镜板      |
| 参考构图 | 上传参考图                | 基于参考图的构图建议   |
| 转场设计 | 情感节奏分析               | 自动匹配转场效果     |

### 4.2 分镜自动生成流程

#### 4.2.1 从 Scene 到 Shot 的映射规则

每个 ScriptScene 自动拆解为多个 Shot，映射规则如下：

| Beat 类型        | 推断规则    | 默认景别   | 默认运镜  |
|:---------------|:--------|:-------|:------|
| `action`（动作）   | 包含环境描述  | 远景/全景  | 固定或慢摇 |
| `action`（人物动作） | 包含人物动作词 | 中景/近景  | 跟拍    |
| `dialogue`     | 对白内容    | 近景/特写  | 固定    |
| `emotion`      | 情绪标注    | 特写（面部） | 缓推    |
| `transition`   | 转场标记    | —      | —     |

**景别推断逻辑**：

```
远全景 (Wide/Full): 建立场景、展示环境、群体场面
全景 (Full): 展示人物全身与环境关系
中景 (Medium): 腰部以上，对话、互动
近景 (Close): 胸部以上，表情、情绪
特写 (Extreme Close): 面部细节、物品特写
```

**机位推断逻辑**：

```
平拍 (Eye Level): 日常对话、常规叙事
俯拍 (High Angle): 展示渺小感、全局视角
仰拍 (Low Angle): 展示威压感、英雄气概
鸟瞰 (Bird's Eye): 地理位置、战场全貌
```

**运镜推断逻辑**：

```
固定 (Static): 对话、静态展示
推 (Push In): 情绪递进、悬念加强
拉 (Pull Out): 揭示环境、情绪疏离
摇 (Pan): 环境扫描、视线引导
移 (Dolly): 跟随人物移动
跟 (Follow): 紧跟人物行动
```

#### 4.2.2 镜头语言 Prompt 生成

每个 Shot 自动生成用于下游视觉生成的 Prompt：

```json
{
  "shot_id": "sh01",
  "type": "establishing",
  "visual_prompt": "Modern high-rise office building exterior, morning sunlight reflecting off glass facade, 4K cinematic, warm color grading",
  "camera": {
    "movement": "slow_pan_right",
    "angle": "wide_shot",
    "duration_seconds": 3
  },
  "audio": {
    "bgm_mood": "tense_corporate",
    "sfx": [
      "office_ambience",
      "keyboard_typing"
    ]
  },
  "transition": "cut"
}
```

### 4.3 分镜数据模型

```json
{
  "storyboard_id": "sb_s01e01_sc01",
  "scene_id": "s01e01_sc01",
  "shots": [
    {
      "shot_id": "sh01",
      "type": "establishing | action | dialogue | reaction | montage",
      "visual_prompt": "string — AI 生成的画面描述（英文）",
      "reference_image_url": "string — 用户上传的参考图 URL（可选）",
      "camera": {
        "movement": "static | push_in | pull_out | pan_left | pan_right | dolly_forward | dolly_back | follow | crane_up | crane_down",
        "angle": "wide_shot | full_shot | medium_shot | close_up | extreme_close_up | bird_eye | low_angle | high_angle | dutch_angle",
        "duration_seconds": 3
      },
      "characters_in_shot": [
        "char_001",
        "char_002"
      ],
      "character_positions": {
        "char_001": {
          "x": 0.3,
          "y": 0.5,
          "facing": "right"
        },
        "char_002": {
          "x": 0.7,
          "y": 0.5,
          "facing": "left"
        }
      },
      "audio": {
        "dialogue_lines": [
          {
            "character": "陈昊",
            "text": "这个方案不行，推翻重来。",
            "emotion": "轻蔑"
          }
        ],
        "bgm_mood": "tense",
        "sfx": [
          "door_slam"
        ]
      },
      "transition": "cut | fade_in | fade_out | dissolve | flash_white | shake | zoom_in",
      "notes": "string — 分镜备注"
    }
  ]
}
```

### 4.4 分镜可视化编辑器

#### 4.4.1 三种视图模式

**① 卡片视图 (Corkboard)**

- 以软木板风格展示所有分镜卡片
- 每张卡片显示：AI 草图预览、镜头类型、景别、时长、角色
- 支持拖拽调整顺序
- 按场次分组，场次间用分隔线区分

**② 时间轴视图 (Timeline)**

- 水平时间轴，每个 Shot 为一个时间块
- 时间块宽度 = duration_seconds
- 上方显示视频轨道，下方显示音频轨道
- 支持缩放（滚轮）和平移（拖拽）

**③ 列表视图 (List)**

- 表格形式展示所有 Shot 的详细参数
- 支持批量编辑（多选后统一修改景别、运镜等）
- 适合快速审查和微调

#### 4.4.2 预览播放器

- 按顺序播放所有 Shot 的 AI 草图 + 音频
- 模拟实际视频节奏
- 支持播放/暂停/跳转
- 显示当前 Shot 的详细信息叠加层

### 4.5 镜头运动与构图规范

**构图原则**：

- 三分法则：人物眼睛位于上三分之一线
- 视线方向：人物视线方向留出更多空间
- 对话构图：正反打镜头，过肩镜头
- 情绪构图：特写用于情绪高点，远景用于情绪疏离

**运镜规范**：

- 推镜头：速度不超过画面宽度/秒的 20%
- 摇镜头：保持匀速，避免急停
- 跟拍：保持人物在画面中心偏左或偏右 1/3 处
- 升降：配合情绪曲线，升高=释然，降低=压迫

### 4.6 分镜与下游模块的数据衔接

分镜输出直接对接下游三个模块：

| 下游模块           | 对接数据                                   | 用途          |
|:---------------|:---------------------------------------|:------------|
| **StyleForge** | `visual_prompt` + `characters_in_shot` | 生成角色立绘和场景背景 |
| **MotionCore** | 完整 Shot 数据                             | 生成视频片段      |
| **VoiceStage** | `audio.dialogue_lines`                 | 生成对白配音      |

### 4.7 AI 镜头建议与自动优化

- **节奏优化**：分析连续 Shot 的景别变化，避免长时间固定同一景别
- **情绪匹配**：根据 `moodTags` 自动调整运镜速度和转场类型
- **多样性检查**：标记连续相同景别/运镜的区间，建议变化
- **时长校验**：验证每个 Shot 的时长是否合理（对白 Shot 按语速估算，动作 Shot 按动作复杂度估算）

---

## PART V — StyleForge 形象工坊

### 5.1 功能概述与用户场景

StyleForge 负责将剧本中的文字描述转化为可视化的角色形象和场景背景，是整个视觉管线的资产源头。

**核心用户场景**：

| 场景    | 输入               | 输出                   |
|:------|:-----------------|:---------------------|
| 角色设计  | 角色文字描述（外貌/性格/服装） | 角色立绘（多种风格）           |
| 一致性锁定 | 生成的角色立绘          | FaceID 特征向量，后续所有镜头一致 |
| 服装换装  | 角色 + 服装描述        | 新服装的角色立绘             |
| 场景生成  | 场景文字描述           | 场景背景图（多景别）           |
| 风格统一  | 选择风格模板           | 所有资产统一为该风格           |

### 5.2 角色视觉设计流程

#### 5.2.1 从文字描述到视觉 Prompt

CharacterDesigner Agent 已生成的 `visualPrompt` 字段作为视觉生成的种子 Prompt。StyleForge 进一步增强：

```
原始描述: "林晚秋，28岁，黑色长发，杏眼，身材纤细，穿着白色衬衫和黑色西裤"

增强 Prompt (英文):
"Young Chinese woman, 28 years old, long black hair, almond eyes, slender figure,
wearing white blouse and black dress pants, professional office setting,
cinematic lighting, 4K, detailed face, natural makeup"
```

增强策略：

- 补充摄影术语（cinematic lighting, depth of field, 4K）
- 补充风格标签（根据用户选择的风格模板）
- 补充负面 Prompt（避免变形、低质量）
- 补充一致性锚点（面部特征关键词）

#### 5.2.2 AI 生图模型接入

| 模型                             | 接入方式       | 适用场景     | API Key 配置       |
|:-------------------------------|:-----------|:---------|:-----------------|
| **Stable Diffusion (ComfyUI)** | 本地部署 / API | 高质量写实/动漫 | 本地无需 Key         |
| **DALL-E 3**                   | OpenAI API | 快速概念图    | `OPENAI_API_KEY` |
| **Midjourney**                 | 第三方 API 封装 | 艺术风格化    | `MJ_API_KEY`     |
| **Flux**                       | 本地部署 / API | 高质量通用    | 本地无需 Key         |
| **可灵 (Kling)**                 | 快手 API     | 中国风/写实   | `KLING_API_KEY`  |

#### 5.2.3 多风格生成

每个角色支持生成多种风格版本：

| 风格    | 标签                        | 适用内容   |
|:------|:--------------------------|:-------|
| 写实风格  | `realistic, photographic` | 短剧/微电影 |
| 二次元风格 | `anime, cel shading`      | 日系动画   |
| 漫画风格  | `comic, manga`            | 漫剧/漫画  |
| 韩漫风格  | `webtoon, Korean manhwa`  | 韩漫动态漫  |
| 国风风格  | `Chinese ink painting`    | 古装/仙侠  |
| 赛博朋克  | `cyberpunk, neon`         | 科幻/未来  |

### 5.3 角色资产包结构

每个角色生成完整的资产包：

```
Character Asset Pack (角色资产包)
├── character_card.json          # 角色元数据
├── visual_description.txt       # 详细视觉描述 (用于 R2V)
├── reference_images/
│   ├── front_view.png           # 正面参考图
│   ├── side_view.png            # 侧面参考图
│   ├── back_view.png            # 背面参考图
│   └── expression_sheet.png     # 表情图集
│       ├── neutral.png          # 平静
│       ├── happy.png            # 开心
│       ├── sad.png              # 悲伤
│       ├── angry.png            # 愤怒
│       ├── surprised.png        # 惊讶
│       └── determined.png       # 坚定
├── face_id_vector.npy           # FaceID 特征向量
├── outfits/                     # 服装变体
│   ├── outfit_01_work.png       # 工作装
│   ├── outfit_02_casual.png     # 休闲装
│   └── outfit_03_formal.png     # 正装
└── style_variations/            # 风格变体
    ├── anime_style.png          # 动漫风格
    ├── realistic_style.png      # 写实风格
    └── comic_style.png          # 漫画风格
```

#### 5.3.1 FaceID 特征向量管理

- 使用 InsightFace / FaceNet 提取面部特征向量 (512 维)
- 生成角色立绘后自动提取并存储
- 后续所有镜头生成时，将 FaceID 向量注入生成 Prompt 或 ControlNet
- 确保同一角色在不同场景、不同情绪下保持面部一致

### 5.4 角色一致性技术 (R2V)

#### 5.4.1 Reference-to-Video 方案

角色一致性是影视制作的核心痛点。灵镜创影采用多层保障：

```
层级 1: Prompt 一致性
├── 固定角色描述 Prompt（每次生成都包含）
├── 固定风格标签
└── 固定负面 Prompt

层级 2: FaceID 锁定
├── InsightFace 提取面部特征
├── IP-Adapter 注入面部特征
└── 跨镜头面部相似度校验

层级 3: LoRA/Embedding（可选）
├── 基于角色立绘训练角色 LoRA
├── 适用于需要极高一致性的场景
└── 需要本地 GPU 支持
```

#### 5.4.2 一致性校验流程

```
生成新 Shot 的角色图
    │
    ▼
提取面部特征向量
    │
    ▼
与 FaceID 基准向量比对
    │
    ├── 相似度 > 0.85 → ✅ 通过
    ├── 相似度 0.70-0.85 → ⚠️ 警告，建议微调
    └── 相似度 < 0.70 → ❌ 重新生成
```

### 5.5 场景视觉设计

#### 5.5.1 场景生成流程

1. 从剧本 Scene 提取 `location`、`time`、`moodTags`
2. 生成场景 Prompt（英文）
3. 调用图像生成模型
4. 支持多景别扩展：

| 景别          | 用途        | 生成方式           |
|:------------|:----------|:---------------|
| 全景 (Wide)   | 建立场景、展示环境 | 直接生成           |
| 中景 (Medium) | 人物互动环境    | 基于全景裁切 + AI 扩展 |
| 特写 (Close)  | 物品/细节     | 直接生成           |
| 仰角 (Low)    | 仰视建筑/天空   | 直接生成           |

#### 5.5.2 场景风格库

预置多种场景风格：

| 风格   | 关键词                                             | 适用题材  |
|:-----|:------------------------------------------------|:------|
| 现代都市 | `modern city, glass buildings, neon lights`     | 都市/职场 |
| 古风庭院 | `Chinese courtyard, bamboo, moonlight`          | 古装/仙侠 |
| 欧式城堡 | `Gothic castle, candlelight, stone walls`       | 奇幻/悬疑 |
| 校园青春 | `school campus, cherry blossoms, warm sunlight` | 校园/青春 |
| 赛博未来 | `cyberpunk city, hologram, rain`                | 科幻    |
| 温馨家居 | `cozy home, warm lighting, plants`              | 甜宠/家庭 |

### 5.6 风格迁移与统一

#### 5.6.1 全局风格指南

用户选择一个风格模板后，系统自动：

1. 将风格标签注入所有后续生成的 Prompt
2. 统一色彩方案（通过 Color Palette 控制）
3. 统一光影风格（通过 Lighting Prompt 控制）
4. 统一线条风格（通过 Style LoRA 控制，可选）

#### 5.6.2 批量风格应用

- 支持对已生成的资产批量应用新风格
- 使用 img2img + ControlNet 保持构图，仅改变风格
- 风格强度可调节（0.0 - 1.0）

### 5.7 资产管理与复用

#### 5.7.1 资产库 CRUD

- 所有生成的角色、场景资产统一存储在 MinIO
- PostgreSQL `assets` 表记录元数据
- 支持搜索、筛选、标签分类
- 支持删除、替换、版本更新

#### 5.7.2 跨项目资产复用

- 资产库支持"全局资产"和"项目资产"两级
- 全局资产可被任何项目引用
- 引用时自动适配目标项目的风格模板
- 修改全局资产时，提示所有引用该项目

---

## PART VI — MotionCore 视频合成引擎

### 6.1 功能概述与双模式架构

MotionCore 是灵镜创影的视频生成核心，根据内容形态提供两条独立的生成路径：

```
                    ┌─────────────────┐
                    │   MotionCore    │
                    │  视频合成引擎    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  A) 漫剧模式     │          │  B) 短剧模式     │
    │  Comic Drama     │          │  Short Film      │
    │  动态漫画风格     │          │  真人短片风格     │
    ├──────────────────┤          ├──────────────────┤
    │ • 图层拆分       │          │ • I2V 图生视频    │
    │ • 关键帧动画     │          │ • T2V 文生视频    │
    │ • 特效贴纸       │          │ • R2V 角色一致性  │
    │ • 镜头运动       │          │ • 口播表演驱动    │
    │ • 对白气泡       │          │ • 超分与修复      │
    └──────────────────┘          └──────────────────┘
```

### 6.2 漫剧模式设计

漫剧模式（动态漫画）是当前短剧市场的主流形态之一，制作成本低、风格化强。

#### 6.2.1 图层拆分

将每个 Shot 的画面自动拆分为多个图层：

```
Shot 画面
├── 背景层 (Background)     — 场景背景，静态或缓慢平移
├── 角色层 (Character)      — 角色立绘，支持动作动画
├── 前景层 (Foreground)     — 前景遮挡物（窗帘、树叶等）
├── 特效层 (Effects)        — 速度线、集中线、气流等
├── 气泡层 (Speech Bubble)  — 对白气泡
└── UI 层 (Overlay)         — 集数标识、标题等
```

**图层拆分方式**：

- **AI 自动拆分**：使用 SAM (Segment Anything Model) 自动分割角色与背景
- **手动标注**：用户可在编辑器中手动调整图层边界
- **预设模板**：漫剧风格提供预设的图层模板

#### 6.2.2 关键帧动画

为每个图层添加微动画，增强漫剧的"动态感"：

| 动画类型   | 效果           | 参数                   |
|:-------|:-------------|:---------------------|
| 呼吸感位移  | 角色微小上下浮动     | 幅度: 2-5px, 频率: 0.3Hz |
| 眨眼     | 角色眼睛周期性闭合    | 间隔: 3-5s, 持续: 0.15s  |
| 头发飘动   | 发丝轻微摆动       | 幅度: 3-8px, 频率: 0.5Hz |
| 微表情    | 嘴角、眉毛微小变化    | 触发: 对白开始时            |
| 衣物飘动   | 衣角、裙摆轻微飘动    | 幅度: 2-6px, 频率: 0.4Hz |
| 背景缓慢平移 | Ken Burns 效果 | 速度: 1-3px/s          |

#### 6.2.3 特效贴纸

漫剧特有的视觉元素：

| 特效类别 | 元素        | 触发条件      |
|:-----|:----------|:----------|
| 速度线  | 放射状线条     | 角色快速移动、震惊 |
| 集中线  | 向心收缩线条    | 重要决定、觉醒时刻 |
| 气流   | 波纹状气流     | 情绪波动、力量爆发 |
| 情绪符号 | 💢😤💕✨❓  | 角色情绪标注触发  |
| 漫画文字 | "砰！""啪！"  | 动作音效      |
| 黑白闪回 | 画面去色 + 噪点 | 回忆场景      |

#### 6.2.4 镜头运动

模拟摄像机运动，增强动态感：

```python
class CameraMotion:
    """漫剧镜头运动控制"""
    type: Literal["static", "push_in", "pull_out", "pan_left", "pan_right", "zoom_in", "zoom_out"]
    speed: float  # 运动速度 (px/s)
    start_frame: int  # 起始帧
    end_frame: int  # 结束帧
    easing: str  # 缓动曲线: "ease_in", "ease_out", "ease_in_out", "linear"
```

### 6.3 短剧模式设计

短剧模式接入外部视频生成模型 API，生成连续视频片段。

#### 6.3.1 I2V (Image-to-Video) 集成

以 StyleForge 生成的角色/场景图作为首帧，生成连续视频：

| 模型               | 接入方式            | 特点         | API Key          |
|:-----------------|:----------------|:-----------|:-----------------|
| **可灵 (Kling)**   | 快手 API          | 中国风、写实、口型好 | `KLING_API_KEY`  |
| **Runway Gen-3** | Runway API      | 电影质感、运动自然  | `RUNWAY_API_KEY` |
| **Pika**         | Pika API        | 动漫风格、快速    | `PIKA_API_KEY`   |
| **Sora**         | OpenAI API（待开放） | 高质量、长视频    | `OPENAI_API_KEY` |
| **CogVideoX**    | 本地部署            | 开源、可本地运行   | 本地无需 Key         |

**I2V 流程**：

1. 从分镜 Shot 获取 `visual_prompt` 和首帧图
2. 构造 I2V 请求：首帧图 + 运动描述 + 时长
3. 调用视频生成 API
4. 获取生成的视频片段
5. 进入后处理流水线

#### 6.3.2 T2V (Text-to-Video) 集成

纯文本描述驱动视频生成（无首帧图时使用）：

```
输入: "A young Chinese woman in white blouse walking confidently through
       a modern office corridor, morning sunlight, cinematic, 4K"

输出: 3-5 秒视频片段
```

#### 6.3.3 R2V (Reference-to-Video) 角色一致性

在 I2V/T2V 基础上，注入角色 FaceID 确保一致性：

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 首帧图   │────▶│  I2V     │────▶│ 视频片段 │
└──────────┘     │  模型    │     └──────────┘
                 │          │
┌──────────┐     │ + FaceID │
│ FaceID   │────▶│ + Prompt │
│ 向量     │     │ + 运动   │
└──────────┘     └──────────┘
```

### 6.4 口型同步 (Lip-Sync)

#### 6.4.1 技术方案

| 技术               | 特点        | 适用场景      |
|:-----------------|:----------|:----------|
| **MuseTalk**     | 开源、实时、质量高 | 漫剧/短剧口型同步 |
| **Wav2Lip**      | 开源、成熟、轻量  | 快速口型同步    |
| **SadTalker**    | 开源、表情丰富   | 头部动作 + 口型 |
| **LivePortrait** | 开源、高精度    | 写实风格口型    |

#### 6.4.2 口型同步流程

```
对白音频 (TTS 生成)
    │
    ▼
┌──────────────┐
│  MuseTalk   │ ← 视频片段（角色面部区域）
│  口型驱动    │
└──────┬───────┘
       │
       ▼
  口型同步后的视频
```

### 6.5 视频合成 Pipeline

#### 6.5.1 完整流水线

```
分镜数据 (Storyboard)
    │
    ├── 漫剧模式 ──────────────────────────────────┐
    │   ├── 1. 图层拆分 (SAM)                       │
    │   ├── 2. 关键帧动画生成                        │
    │   ├── 3. 特效贴纸叠加                          │
    │   ├── 4. 镜头运动渲染                          │
    │   └── 5. 帧序列合成                            │
    │                                               ▼
    ├── 短剧模式 ──────────────────────┐      ┌──────────────┐
    │   ├── 1. 首帧图准备              │      │  后处理流水线  │
    │   ├── 2. I2V/T2V 调用            │─────▶│  • 人脸修复   │
    │   ├── 3. R2V 一致性注入           │      │  • 画质超分   │
    │   └── 4. 口型同步 (MuseTalk)     │      │  • 去闪烁     │
    │                                  │      │  • 色彩校正   │
    └──────────────────────────────────┘      └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │  FFmpeg 编码  │
                                              │  H.264/H.265 │
                                              │  输出 MP4     │
                                              └──────────────┘
```

#### 6.5.2 异步任务队列

视频生成为耗时操作，通过 Celery 异步处理：

```python
from celery import Celery

app = Celery('motioncore', broker='redis://localhost:6379/1')


@app.task(bind=True, max_retries=3, time_limit=600)
def generate_video_segment(self, shot_id: str, mode: str, params: dict):
    """生成单个 Shot 的视频片段"""
    try:
        if mode == 'comic':
            result = comic_pipeline(shot_id, params)
        elif mode == 'short_film':
            result = short_film_pipeline(shot_id, params)

        # 后处理
        result = post_process(result)
        # 存储到 MinIO
        url = upload_to_minio(result)
        return {"shot_id": shot_id, "video_url": url, "status": "completed"}
    except Exception as exc:
        self.retry(exc=exc, countdown=30)
```

### 6.6 视频质量控制

| 参数   | 漫剧模式                    | 短剧模式                  |
|:-----|:------------------------|:----------------------|
| 分辨率  | 1920×1080 / 1080×1920   | 1920×1080 / 1080×1920 |
| 帧率   | 24fps / 30fps           | 24fps / 30fps         |
| 编码   | H.264 (兼容) / H.265 (高效) | H.264 / H.265         |
| 码率   | 8-15 Mbps               | 15-30 Mbps            |
| 色彩空间 | sRGB                    | sRGB / HDR (可选)       |

**转场效果库**：

| 转场类型          | 适用场景  | 视觉效果 |
|:--------------|:------|:-----|
| `cut`         | 常规切换  | 直接切换 |
| `fade_in`     | 场景开始  | 从黑渐入 |
| `fade_out`    | 场景结束  | 渐变到黑 |
| `dissolve`    | 时间推移  | 交叉溶解 |
| `flash_white` | 回忆/觉醒 | 闪白   |
| `shake`       | 震惊/冲突 | 画面抖动 |
| `zoom_in`     | 悬念/特写 | 快速推进 |
| `slide_left`  | 场景切换  | 左滑切换 |

### 6.7 渲染性能优化

- **GPU 资源管理**：视频生成任务排队，避免 GPU 内存溢出
- **批量渲染**：多个短 Shot 合并为一个渲染批次
- **缓存策略**：已生成的片段缓存在 MinIO，避免重复生成
- **分辨率降级预览**：先生成 480p 预览，确认后再生成 1080p/4K
- **增量渲染**：仅重新渲染修改的 Shot，保留未修改的部分

---

## PART VII — VoiceStage 声演剧场

### 7.1 功能概述与用户场景

VoiceStage 负责为剧本对白、旁白、环境音生成高质量语音，是影视作品"声音灵魂"的制造者。

**核心用户场景**：

| 场景    | 输入              | 输出           |
|:------|:----------------|:-------------|
| 对白配音  | 剧本对白文本 + 角色音色绑定 | 分角色的对白音频     |
| 旁白生成  | 环境描述 / 内心独白文本   | 标准旁白音轨       |
| 语音克隆  | 上传声音样本 + 目标文本   | 克隆音色的语音      |
| 情感控制  | 对白 + 情绪标注       | 带情感的语音       |
| 时间轴对齐 | 音频 + 分镜时间线      | 对齐到 Shot 的音轨 |

### 7.2 TTS 配音系统

#### 7.2.1 多引擎 TTS 接入

| TTS 引擎           | 接入方式           | 特点             | API Key              |
|:-----------------|:---------------|:---------------|:---------------------|
| **Edge-TTS**     | 免费 API         | 免费、多语种、多音色     | 无需 Key               |
| **CosyVoice**    | 本地部署 / API     | 阿里开源、中文优秀、情感丰富 | 本地无需 Key             |
| **GPT-SoVITS**   | 本地部署           | 开源、声音克隆能力强     | 本地无需 Key             |
| **Fish-Speech**  | 本地部署 / API     | 开源、低延迟         | 本地无需 Key             |
| **Azure Speech** | Azure API      | 商业级、稳定         | `AZURE_SPEECH_KEY`   |
| **ElevenLabs**   | ElevenLabs API | 英文最佳、声音克隆      | `ELEVENLABS_API_KEY` |

#### 7.2.2 语音风格选择与参数调节

每个 TTS 引擎支持以下调节参数：

```python
class VoiceConfig:
    """语音配置"""
    engine: str  # TTS 引擎名称
    voice_id: str  # 音色 ID
    language: str  # 语言: zh-CN, en-US, ja-JP, ko-KR
    speed: float  # 语速: 0.5-2.0 (默认 1.0)
    pitch: float  # 音调: -50~+50 (默认 0)
    volume: float  # 音量: 0.0-1.0 (默认 1.0)
    emotion: str  # 情绪: neutral, happy, sad, angry, gentle, excited
    style_degree: float  # 情感强度: 0.0-2.0 (默认 1.0)
```

#### 7.2.3 多情感语种库

| 语言         | 预置音色数 | 情感支持                                    |
|:-----------|:------|:----------------------------------------|
| 中文 (zh-CN) | 20+   | 开心、悲伤、愤怒、温柔、激动、平静                       |
| 英文 (en-US) | 15+   | happy, sad, angry, cheerful, empathetic |
| 日文 (ja-JP) | 10+   | 喜び、悲しみ、怒り、穏やか                           |
| 韩文 (ko-KR) | 8+    | 기쁨, 슬픔, 분노, 부드러움                        |

### 7.3 声音克隆

#### 7.3.1 声音样本采集规范

- 时长：最少 10 秒，推荐 30-60 秒
- 格式：WAV / FLAC，16kHz+ 采样率
- 环境：安静无回声，信噪比 > 30dB
- 内容：自然朗读，包含多种语调变化

#### 7.3.2 克隆模型训练流程

```
上传声音样本
    │
    ▼
音频预处理 (降噪、归一化)
    │
    ▼
特征提取 (说话人嵌入向量)
    │
    ├── 快速克隆模式 ──▶ 提取 embedding，直接用于 TTS
    │                    (30 秒样本即可，质量一般)
    │
    └── 精细克隆模式 ──▶ 微调 TTS 模型
                         (5 分钟+ 样本，质量高)
                         需要本地 GPU
```

#### 7.3.3 克隆声音管理

- 克隆声音存储为 VoiceProfile，与角色绑定
- 支持预览试听、删除、替换
- 支持跨项目复用

### 7.4 音频同步引擎

#### 7.4.1 对白时间轴对齐

将生成的对白音频自动对齐到分镜时间线：

```
Shot Timeline:
|----3s----|----5s----|----4s----|
  镜头1      对白A      镜头2

对白 A 时长: 3.2s
对齐方式: 对白起始 = 对白 Beat 起始时间
          对白结束 = min(对白时长, Beat 时长)
          如果对白时长 > Beat 时长 → 自动加速
          如果对白时长 < Beat 时长 → 填充静音
```

#### 7.4.2 语速/语调/情感控制

- 语速调节：0.5x - 2.0x，保持音调自然
- 情感注入：根据剧本 `emotion` 标注自动选择情感风格
- 停顿控制：在逗号、句号、感叹号处自动插入自然停顿
- 强调标记：对加粗文本增加语调强调

#### 7.4.3 多角色对话编排

- 连续对白自动拼接，角色间插入 0.3-0.5s 间隔
- 支持"抢话"效果（负间隔）
- 支持"沉默"效果（角色有对白但选择不说话）

### 7.5 音频后处理

| 处理  | 说明             | 工具                    |
|:----|:---------------|:----------------------|
| 降噪  | 去除背景噪声         | noisereduce / RNNoise |
| 均衡  | 调整频响曲线         | pydub / scipy         |
| 混响  | 添加空间感          | pedalboard            |
| 压缩  | 动态范围压缩         | pydub                 |
| 标准化 | 统一音量到 -16 LUFS | pyloudnorm            |

### 7.6 音频数据模型

```python
class VoiceProfile:
    """角色声音配置"""
    id: str
    character_id: str  # 绑定的角色 ID
    name: str  # 音色名称
    engine: str  # TTS 引擎
    voice_id: str  # 引擎内部音色 ID
    language: str  # 主语言
    emotion_default: str  # 默认情感
    speed_default: float  # 默认语速
    clone_source_url: str  # 克隆样本 URL（可选）
    embedding_vector: bytes  # 声音嵌入向量（克隆模式）


class DialogueSegment:
    """对白片段"""
    id: str
    shot_id: str  # 关联的 Shot ID
    character_id: str  # 角色 ID
    text: str  # 对白文本
    emotion: str  # 情绪标注
    start_time_ms: int  # 起始时间（毫秒）
    end_time_ms: int  # 结束时间（毫秒）
    audio_url: str  # 生成的音频 URL
    duration_ms: int  # 音频实际时长
```

---

## PART VIII — SoundGen BGM与音效智选

### 8.1 功能概述与用户场景

SoundGen 负责为影视作品添加背景音乐和音效，通过 AI 分析情感曲线自动匹配或生成。

**核心用户场景**：

| 场景     | 输入        | 输出         |
|:-------|:----------|:-----------|
| BGM 匹配 | 场景情绪标签    | 推荐的 BGM 列表 |
| BGM 生成 | 情绪描述 + 时长 | AI 生成的 BGM |
| 音效叠加   | 动作描述      | 自动叠加的音效    |
| 自动混音   | 所有音轨      | 混合后的最终音轨   |

### 8.2 BGM 智能推荐

#### 8.2.1 情感-音乐映射

系统维护一套情感到音乐风格的映射表：

| 情绪标签 | 推荐音乐风格    | BPM 范围  | 调性  |
|:-----|:----------|:--------|:----|
| 紧张   | 暗色弦乐、电子脉冲 | 100-140 | 小调  |
| 温馨   | 钢琴、原声吉他   | 60-90   | 大调  |
| 搞笑   | 俏皮管乐、拨弦   | 110-140 | 大调  |
| 悲伤   | 慢速钢琴、大提琴  | 50-70   | 小调  |
| 热血   | 史诗鼓点、电吉他  | 120-160 | 大调  |
| 悬疑   | 低频嗡鸣、不和谐音 | 70-100  | 减和弦 |
| 甜蜜   | 轻快弦乐、音乐盒  | 90-120  | 大调  |
| 愤怒   | 重金属、工业电子  | 130-170 | 小调  |

#### 8.2.2 AI 生成 BGM 接入

| 模型               | 接入方式          | 特点         | API Key             |
|:-----------------|:--------------|:-----------|:--------------------|
| **Suno**         | Suno API      | 高质量、风格丰富   | `SUNO_API_KEY`      |
| **Udio**         | Udio API      | 高质量、可控性强   | `UDIO_API_KEY`      |
| **MusicGen**     | 本地部署          | Meta 开源、轻量 | 本地无需 Key            |
| **Stable Audio** | Stability API | 开源、可本地部署   | `STABILITY_API_KEY` |

#### 8.2.3 BGM 调节参数

```python
class BGMConfig:
    """BGM 配置"""
    track_id: str  # 音轨 ID
    source: str  # 来源: "library" | "ai_generated" | "uploaded"
    volume: float  # 音量: 0.0-1.0
    start_time_ms: int  # 起始时间
    fade_in_ms: int  # 淡入时长
    fade_out_ms: int  # 淡出时长
    loop: bool  # 是否循环
    intensity: float  # 强度: 0.0-1.0（影响音量和编曲密度）
```

### 8.3 音效库设计

#### 8.3.1 分类体系

| 大类        | 子类 | 示例             |
|:----------|:---|:---------------|
| **环境音**   | 室内 | 办公室嘈杂、咖啡馆、安静卧室 |
|           | 室外 | 城市街道、公园、海边     |
|           | 天气 | 雨声、雷声、风声、雪     |
| **动作音**   | 脚步 | 高跟鞋、皮鞋、运动鞋、赤脚  |
|           | 物体 | 开门、关门、杯子碰撞、翻书  |
|           | 交通 | 汽车引擎、刹车、地铁     |
| **情绪音**   | 紧张 | 心跳加速、时钟滴答      |
|           | 惊悚 | 尖叫、玻璃碎裂        |
|           | 甜蜜 | 钟声、鸟鸣          |
| **UI 音效** | 系统 | 消息提示、按钮点击、过渡   |

#### 8.3.2 音效搜索与预览

- 支持关键词搜索（中英文）
- 支持按分类浏览
- 支持预览播放（点击即播放 3 秒片段）
- 支持收藏标记

#### 8.3.3 AI 音效生成

当内置音效库无法满足需求时，可通过 AI 生成：

| 模型                        | 接入方式           | 用途             |
|:--------------------------|:---------------|:---------------|
| **AudioCraft (AudioGen)** | 本地部署           | Meta 开源，文本生成音效 |
| **ElevenLabs SFX**        | ElevenLabs API | 高质量音效生成        |
| **Stable Audio**          | Stability API  | 音效 + 音乐生成      |

### 8.4 音频混合引擎

#### 8.4.1 多轨混音架构

```
┌─────────────────────────────────────────────────┐
│                  最终混音输出                      │
│                  (Master Track)                   │
├─────────────────────────────────────────────────┤
│  对白轨 (Dialogue)    ─── VoiceStage 生成        │
│  旁白轨 (Narration)   ─── VoiceStage 生成        │
│  BGM 轨 (Background)  ─── SoundGen 推荐/生成     │
│  音效轨 (SFX)         ─── SoundGen 库/生成       │
│  环境音轨 (Ambience)  ─── SoundGen 环境音        │
└─────────────────────────────────────────────────┘
```

#### 8.4.2 音量自动调节 (Ducking)

智能闪避功能：当对白出现时，自动降低 BGM 和环境音音量。

```python
class DuckingConfig:
    """闪避配置"""
    enabled: bool = True
    duck_amount_db: float = -8.0  # 闪避衰减量 (dB)
    attack_ms: int = 100  # 闪避启动时间 (ms)
    release_ms: int = 300  # 闪避释放时间 (ms)
    threshold_db: float = -30.0  # 触发闪避的对白音量阈值
```

**混音规则**：

- 对白音量基准：-16 LUFS
- BGM 基准音量：-24 LUFS（对白时降至 -32 LUFS）
- 音效基准音量：-20 LUFS
- 环境音基准音量：-30 LUFS
- 最终输出标准化到 -14 LUFS（适合流媒体）

### 8.5 音频数据模型

```python
class BGMTrack:
    """BGM 音轨"""
    id: str
    project_id: str
    name: str  # 音轨名称
    source: str  # "library" | "ai_generated" | "uploaded"
    file_url: str  # 音频文件 URL
    duration_ms: int  # 总时长
    bpm: int  # 节拍
    key: str  # 调性
    mood_tags: List[str]  # 情绪标签
    volume: float  # 音量 0.0-1.0
    start_time_ms: int  # 在时间线上的起始位置
    fade_in_ms: int
    fade_out_ms: int


class SoundEffect:
    """音效"""
    id: str
    name: str
    category: str  # 分类
    file_url: str
    duration_ms: int
    trigger_type: str  # "manual" | "auto_by_action" | "auto_by_emotion"
    trigger_keywords: List[str]  # 触发关键词


class AudioMix:
    """混音配置"""
    id: str
    project_id: str
    dialogue_tracks: List[str]  # 对白轨 ID 列表
    bgm_tracks: List[str]  # BGM 轨 ID 列表
    sfx_tracks: List[str]  # 音效轨 ID 列表
    ambience_tracks: List[str]  # 环境音轨 ID 列表
    ducking_config: DuckingConfig
    master_volume: float  # 主音量
    output_format: str  # "wav" | "mp3" | "aac"
    output_lufs: float  # 目标响度
```

---

## PART IX — 项目管理与协作

### 9.1 项目生命周期管理

#### 9.1.1 项目状态机

```
draft (草稿)
    │
    ├──▶ in_progress (进行中)
    │        │
    │        ├──▶ review (审阅中)
    │        │        │
    │        │        ├──▶ in_progress (返回修改)
    │        │        │
    │        │        └──▶ completed (已完成)
    │        │
    │        └──▶ completed (直接完成)
    │
    └──▶ archived (已归档)
```

#### 9.1.2 项目操作

| 操作   | 说明                | 权限    |
|:-----|:------------------|:------|
| 创建项目 | 填写标题、题材、目标集数等基本信息 | 所有用户  |
| 编辑项目 | 修改项目元数据           | 项目所有者 |
| 归档项目 | 移入归档列表，不再显示在主列表   | 项目所有者 |
| 删除项目 | 永久删除项目及所有关联数据     | 项目所有者 |
| 复制项目 | 基于现有项目创建副本        | 所有用户  |
| 导出项目 | 导出为 JSON/ZIP 包    | 项目所有者 |

### 9.2 项目数据模型

#### 9.2.1 核心实体关系图

```
User (1) ──── (N) Project
Project (1) ──── (1) Script
Project (1) ──── (N) Character
Project (1) ──── (N) Episode
Episode (1) ──── (N) Scene
Scene (1) ──── (N) Beat
Project (1) ──── (N) Asset
Project (1) ──── (N) StoryboardShot
Project (1) ──── (N) AudioTrack
Project (1) ──── (N) AgentSession
AgentSession (1) ──── (N) AgentMessage
Character (1) ──── (N) VoiceProfile
Scene (1) ──── (N) SoundEffect
```

#### 9.2.2 项目看板

项目列表页以看板形式展示：

```
┌──────────┬──────────┬──────────┬──────────┐
│  草稿     │  进行中   │  审阅中   │  已完成   │
├──────────┼──────────┼──────────┼──────────┤
│ 古宅迷局  │ 逆袭女王  │          │ 甜蜜陷阱  │
│ [12集]    │ [20集]    │          │ [16集]    │
│ 悬疑      │ 都市复仇  │          │ 甜宠      │
└──────────┴──────────┴──────────┴──────────┘
```

### 9.3 团队协作

#### 9.3.1 角色权限模型

| 角色      | 权限                     |
|:--------|:-----------------------|
| **所有者** | 全部权限：编辑、删除、导出、管理成员     |
| **编辑者** | 编辑剧本、角色、分镜；不能删除项目或管理成员 |
| **审阅者** | 查看全部内容、添加批注；不能编辑       |
| **查看者** | 只读访问                   |

#### 9.3.2 项目共享

- 生成分享链接（带权限等级）
- 支持密码保护
- 支持有效期设置

#### 9.3.3 逐帧批注

- 在分镜板的任意 Shot 上添加文字批注
- 批注关联到具体时间点
- 支持 @提及协作者
- 批注状态：待处理 / 已解决 / 已关闭

### 9.4 项目仪表盘

```
┌─────────────────────────────────────────────────┐
│  项目: 逆袭女王                                   │
│  状态: 进行中 · 题材: 都市/复仇/逆袭              │
├─────────────┬─────────────┬─────────────────────┤
│  进度概览    │  资产统计    │  最近活动             │
│             │             │                     │
│  剧本: 80%  │  角色: 5    │  2h前: AI生成第8集剧本 │
│  分镜: 60%  │  场景: 12   │  5h前: 上传角色参考图  │
│  视频: 30%  │  BGM: 8     │  1天前: 修改角色设定   │
│  音频: 20%  │  音效: 24   │  2天前: 创建项目       │
│             │  视频: 45段  │                     │
└─────────────┴─────────────┴─────────────────────┘
```

### 9.5 导入/导出

#### 9.5.1 项目数据导入

- 导入 JSON 格式的项目数据（兼容本系统导出格式）
- 导入 Fountain 格式剧本
- 导入 Final Draft (.fdx) 格式剧本

#### 9.5.2 项目模板

系统内置项目模板，加速创作起步：

| 模板     | 说明       | 预置内容      |
|:-------|:---------|:----------|
| 都市短剧模板 | 20 集竖屏短剧 | 集数结构、节奏模板 |
| 漫剧模板   | 16 集动态漫  | 分格模板、气泡样式 |
| 悬疑微电影  | 90 分钟电影  | 三幕剧结构     |
| 空白模板   | 从零开始     | 无预置       |

---

## PART X — 导出与发布

### 10.1 视频导出

#### 10.1.1 导出格式与编码

| 格式   | 编码     | 适用场景        |
|:-----|:-------|:------------|
| MP4  | H.264  | 通用兼容，社交平台上传 |
| MP4  | H.265  | 高效压缩，文件更小   |
| MOV  | ProRes | 专业后期，无损质量   |
| WebM | VP9    | 网页嵌入        |

#### 10.1.2 分辨率选项

| 分辨率                  | 比例   | 适用场景            |
|:---------------------|:-----|:----------------|
| 3840×2160 (4K)       | 16:9 | 高清横屏            |
| 1920×1080 (1080p)    | 16:9 | 标准横屏            |
| 1280×720 (720p)      | 16:9 | 快速预览            |
| 2160×3840 (4K 竖屏)    | 9:16 | 高清竖屏            |
| 1080×1920 (1080p 竖屏) | 9:16 | 标准竖屏            |
| 1080×1080            | 1:1  | 方形视频（Instagram） |

#### 10.1.3 水印控制

- 开源版本默认无水印
- 支持自定义水印（文字/图片）
- 水印位置：左上/右上/左下/右下/居中
- 水印透明度可调

### 10.2 音频导出

| 导出内容   | 格式              | 说明           |
|:-------|:----------------|:-------------|
| 最终混音   | MP3 / AAC / WAV | 包含所有音轨的混合    |
| 对白音轨   | WAV / FLAC      | 仅对白，无 BGM/音效 |
| BGM 音轨 | MP3 / WAV       | 仅背景音乐        |
| 音效音轨   | WAV             | 仅音效          |
| 分轨导出   | WAV (多文件)       | 每个音轨独立文件     |

### 10.3 字幕导出

#### 10.3.1 字幕格式

| 格式   | 说明       | 适用场景 |
|:-----|:---------|:-----|
| SRT  | 最通用的字幕格式 | 通用   |
| ASS  | 支持样式和定位  | 高级字幕 |
| VTT  | Web 字幕格式 | 网页嵌入 |
| JSON | 结构化字幕数据  | 程序处理 |

#### 10.3.2 字幕内容

- 对白文本 + 时间戳
- 角色名标注（可选）
- 情绪标注（可选，用于特效字幕）
- 双语字幕支持（中英/中日/中韩）

### 10.4 剧本导出

| 格式                 | 说明               |
|:-------------------|:-----------------|
| PDF                | 带格式的剧本，适合打印      |
| Fountain           | 通用编剧格式，可导入其他编剧软件 |
| Final Draft (.fdx) | 专业编剧软件格式         |
| Markdown           | 轻量级文本格式          |
| JSON               | 结构化数据，程序处理       |

### 10.5 分镜板导出

| 格式       | 内容                           |
|:---------|:-----------------------------|
| PDF 分镜册  | 每页 2-6 个 Shot，含缩略图 + 描述 + 参数 |
| 图片序列     | 每个 Shot 导出为独立 PNG            |
| HTML 幻灯片 | 可交互的分镜预览页                    |

### 10.6 批量导出与任务队列

- 导出为异步任务，通过 Celery 处理
- 支持批量导出（多个集数/多个格式同时导出）
- 导出进度实时推送（WebSocket）
- 导出完成后通知用户下载

### 10.7 导出 Pipeline

```
用户配置导出参数
    │
    ▼
创建导出任务 (Celery)
    │
    ├── 1. 视频合成
    │   ├── 合并所有 Shot 视频片段
    │   ├── 添加转场效果
    │   └── 应用色彩校正
    │
    ├── 2. 音频混音
    │   ├── 合并对白 + BGM + 音效
    │   ├── 应用 Ducking
    │   └── 标准化响度
    │
    ├── 3. 音视频合并
    │   ├── FFmpeg 合并视频 + 音频
    │   ├── 嵌入字幕（可选）
    │   └── 添加水印（可选）
    │
    ├── 4. 编码输出
    │   ├── 按目标分辨率/编码重新编码
    │   └── 输出到 MinIO
    │
    └── 5. 通知下载
        ├── WebSocket 推送完成通知
        └── 生成下载链接
```

---

## PART XI — 技术架构设计

### 11.1 系统整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        前端表现层 (Frontend)                         │
│  Next.js 14+ App Router · shadcn/ui · Tailwind CSS                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │ 项目列表  │ Agent    │ 剧本     │ 分镜板   │ 设置     │          │
│  │ Dashboard │ Chat UI  │ Editor   │ Board    │ Settings │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────▼─────────────────────────────────────┐
│                        API 网关层 (Gateway)                          │
│  FastAPI · WebSocket Server · JWT Auth · Rate Limiting              │
│  ┌──────────────┬──────────────┬──────────────┐                    │
│  │ REST API     │ WebSocket    │ Auth 中间件   │                    │
│  │ :8080        │ :8080/ws     │ JWT + API Key │                    │
│  └──────────────┴──────────────┴──────────────┘                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                   Agent 编排层 (Agent Engine) :8001                  │
│  DeepAgents (LangChain/LangGraph) · LangSmith                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │Showrunner│World     │Character │Script    │HITL      │          │
│  │ Agent    │Builder   │Designer  │Doctor    │审核节点   │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
│  ┌──────────────┬──────────────┬──────────────┐                    │
│  │ Tool Registry│ Skill System │ Plan & Solve │                    │
│  └──────────────┴──────────────┴──────────────┘                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                     记忆与知识层 (Memory & Knowledge)                 │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │ ChromaDB     │ Neo4j        │ Redis        │ MinIO        │     │
│  │ 向量记忆     │ 关系图谱     │ 会话缓存     │ 资产存储     │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                       AI 模型层 (AI Models)                          │
│  AI Gateway · Model Catalog · API Key Management                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │ Qwen-Max │ GPT-4o   │ Claude   │ DeepSeek │ Embedding│          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                   生产 Pipeline 层 (Production)                      │
│  Celery Workers · FFmpeg · GPU Workers                              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │ 剧本解析  │ 分镜生成  │ 视频引擎  │ 音频工厂  │ 时间线   │          │
│  │ Parser   │Storyboard│MotionCore│VoiceStage│ Engine   │          │
│  │          │ AI       │          │+SoundGen │          │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 技术选型详细说明

#### 11.2.1 前端技术栈

| 组件       | 选型                      | 版本     | 说明                              |
|:---------|:------------------------|:-------|:--------------------------------|
| 框架       | Next.js                 | 14+    | App Router, RSC, Server Actions |
| UI 库     | shadcn/ui               | latest | 可定制、无运行时、基于 Radix               |
| 样式       | Tailwind CSS            | 3.4+   | 原子化 CSS                         |
| 状态管理     | React Context + Zustand | -      | 轻量级状态管理                         |
| 图标       | Lucide React            | latest | 一致的图标库                          |
| Markdown | react-markdown + remark | -      | Agent 聊天消息渲染                    |
| 拖拽       | @dnd-kit                | latest | 分镜板拖拽排序                         |
| 图表       | Recharts                | latest | 项目仪表盘                           |

#### 11.2.2 后端技术栈

| 组件   | 选型               | 版本     | 说明            |
|:-----|:-----------------|:-------|:--------------|
| 框架   | FastAPI          | 0.110+ | 异步、自动文档、类型安全  |
| ORM  | SQLAlchemy       | 2.0+   | 异步支持          |
| 数据库  | PostgreSQL       | 16+    | 业务数据存储        |
| 缓存   | Redis            | 7+     | 会话缓存、任务队列     |
| 任务队列 | Celery           | 5.3+   | 异步任务（视频/音频生成） |
| 对象存储 | MinIO            | latest | 资产文件存储（S3 兼容） |
| 视频处理 | FFmpeg           | 6.0+   | 视频编码、合并、转码    |
| 容器化  | Docker + Compose | latest | 开发和部署标准化      |

#### 11.2.3 AI/Agent 技术栈

| 组件        | 选型                                | 说明                     |
|:----------|:----------------------------------|:-----------------------|
| Agent 框架  | DeepAgents (LangChain/LangGraph)  | 状态图编排、HITL、记忆          |
| 向量数据库     | ChromaDB                          | 嵌入式、零运维、LangChain 原生支持 |
| 图数据库      | Neo4j                             | 人物关系图谱（Phase 2 引入）     |
| Embedding | text-embedding-3-small            | MVP 阶段，中文效果好           |
| Agent 调试  | LangSmith                         | Agent 执行追踪和可视化         |
| 图像生成      | SD / DALL-E / Flux                | 多模型路由                  |
| 视频生成      | Kling / Runway / CogVideoX        | 多模型路由                  |
| TTS       | Edge-TTS / CosyVoice / GPT-SoVITS | 多引擎路由                  |
| 音乐生成      | Suno / MusicGen                   | 多模型路由                  |

### 11.3 部署架构

#### 11.3.1 Docker Compose 单机部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080
      - NEXT_PUBLIC_AGENT_ENGINE_URL=http://agent-engine:8001

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
      - minio
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/framemind
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000

  agent-engine:
    build: ./agent-engine
    ports:
      - "8001:8001"
    depends_on:
      - postgres
      - redis
      - chromadb
    environment:
      - CHROMA_PERSIST_DIR=/chroma_data
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=framemind
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - chromadata:/chroma/chroma
    environment:
      - ANONYMIZED_TELEMETRY=False

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin

  celery-worker:
    build: ./backend
    command: celery -A tasks worker --loglevel=info --concurrency=2
    depends_on:
      - redis
      - minio
    environment:
      - REDIS_URL=redis://redis:6379/1
      - MINIO_ENDPOINT=minio:9000

  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4jdata:/data
    environment:
      - NEO4J_AUTH=neo4j/password

volumes:
  pgdata:
  redisdata:
  chromadata:
  miniodata:
  neo4jdata:
```

#### 11.3.2 GPU 资源调度

视频生成和图像生成需要 GPU 资源：

- **GPU Worker**：独立的 Celery Worker，配置 GPU 资源
- **任务队列隔离**：GPU 任务和 CPU 任务使用不同队列
- **内存管理**：任务开始前检查 GPU 显存，不足时排队等待
- **模型预加载**：常用模型预加载到 GPU 显存，避免重复加载

### 11.4 安全设计

#### 11.4.1 API Key 加密存储

```python
from cryptography.fernet import Fernet


class APIKeyManager:
    """API Key 加密管理"""

    def __init__(self, encryption_key: str):
        self.cipher = Fernet(encryption_key.encode())

    def encrypt_key(self, api_key: str) -> str:
        """加密 API Key"""
        return self.cipher.encrypt(api_key.encode()).decode()

    def decrypt_key(self, encrypted_key: str) -> str:
        """解密 API Key"""
        return self.cipher.decrypt(encrypted_key.encode()).decode()

    def mask_key(self, api_key: str) -> str:
        """遮蔽 API Key，仅显示后 4 位"""
        return f"****{api_key[-4:]}"
```

#### 11.4.2 用户认证

- JWT Token 认证
- Token 有效期：24 小时
- Refresh Token 有效期：30 天
- 密码使用 bcrypt 哈希存储

#### 11.4.3 数据隔离

- 每个项目的数据严格隔离
- API 端点强制校验 project_id 所有权
- Agent 会话绑定到项目，不能跨项目访问

### 11.5 性能设计

#### 11.5.1 缓存策略

| 数据类型       | 缓存位置        | TTL  | 说明       |
|:-----------|:------------|:-----|:---------|
| Agent 会话状态 | Redis       | 24h  | 会话级缓存    |
| 项目元数据      | Redis       | 5min | 减少 DB 查询 |
| 角色列表       | Redis       | 5min | 减少 DB 查询 |
| 向量检索结果     | 内存          | 1min | 高频查询缓存   |
| 静态资产       | CDN / Nginx | 7d   | 图片、音频、视频 |

#### 11.5.2 数据库索引

```sql
-- 高频查询索引
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_episodes_project_id ON episodes(project_id);
CREATE INDEX idx_scenes_episode_id ON scenes(episode_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_agent_sessions_project_id ON agent_sessions(project_id);
CREATE INDEX idx_agent_messages_session_id ON agent_messages(session_id);

-- 复合索引
CREATE INDEX idx_scenes_episode_number ON scenes(episode_id, scene_number);
CREATE INDEX idx_characters_project_role ON characters(project_id, role_type);
```

### 11.6 可观测性

#### 11.6.1 日志规范

```python
import structlog

logger = structlog.get_logger()

# Agent 执行日志
logger.info("agent_execution",
            agent="showrunner",
            project_id="proj_001",
            action="generate_outline",
            tokens_used=1500,
            duration_ms=3200,
            )

# Pipeline 任务日志
logger.info("pipeline_task",
            task_type="video_generation",
            shot_id="sh01",
            status="completed",
            duration_ms=45000,
            )
```

#### 11.6.2 LangSmith 集成

- 所有 Agent 调用自动追踪到 LangSmith
- 记录：输入、输出、工具调用、Token 消耗、延迟
- 支持回放 Agent 执行过程
- 用于调试和优化 Agent 行为

#### 11.6.3 健康检查

```
GET /health          → 基础健康检查
GET /health/detailed → 包含各组件状态
{
  "status": "healthy",
  "components": {
    "database": "ok",
    "redis": "ok",
    "chromadb": "ok",
    "minio": "ok",
    "celery": "ok"
  }
}
```

---

## PART XII — 数据模型与 API 设计

### 12.1 核心实体关系图

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  users   │────▶│ projects │────▶│ scripts  │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                      ├────────────▶┌──────────┐
                      │             │characters│
                      │             └──────────┘
                      │
                      ├────────────▶┌──────────┐
                      │             │ episodes │
                      │             └────┬─────┘
                      │                  │
                      │                  ▼
                      │             ┌──────────┐
                      │             │  scenes  │
                      │             └────┬─────┘
                      │                  │
                      │                  ▼
                      │             ┌──────────┐
                      │             │  beats   │
                      │             └──────────┘
                      │
                      ├────────────▶┌──────────┐
                      │             │  assets  │
                      │             └──────────┘
                      │
                      ├────────────▶┌──────────────┐
                      │             │storyboard_   │
                      │             │shots         │
                      │             └──────────────┘
                      │
                      ├────────────▶┌──────────┐
                      │             │audio_    │
                      │             │tracks    │
                      │             └──────────┘
                      │
                      └────────────▶┌──────────────┐
                                    │agent_sessions│
                                    └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │agent_messages │
                                    └──────────────┘
```

### 12.2 PostgreSQL 表结构定义

```sql
-- ==================== 用户表 ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    password_hash VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 项目表 ====================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(50)[],
    status VARCHAR(20) DEFAULT 'draft',
    target_episodes INTEGER DEFAULT 20,
    target_duration_minutes FLOAT DEFAULT 2.5,
    style_reference TEXT,
    output_mode VARCHAR(20) DEFAULT 'comic',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 角色表 ====================
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role_type VARCHAR(20),
    description TEXT,
    personality JSONB,
    appearance TEXT,
    backstory TEXT,
    arc_description TEXT,
    dialogue_style TEXT,
    visual_prompt TEXT,
    face_id_vector BYTEA,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 剧本表 ====================
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    content JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 集数表 ====================
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(200),
    summary TEXT,
    duration_minutes FLOAT,
    status VARCHAR(20) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 场景表 ====================
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    location VARCHAR(200),
    time_of_day VARCHAR(50),
    mood_tags VARCHAR(50)[],
    characters_present VARCHAR(100)[],
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 节拍表 ====================
CREATE TABLE beats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    beat_number INTEGER NOT NULL,
    type VARCHAR(20),
    content TEXT,
    character_name VARCHAR(100),
    emotion VARCHAR(50),
    camera_suggestion VARCHAR(100),
    duration_seconds FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 资产表 ====================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(30),
    name VARCHAR(200),
    file_url TEXT,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    tags VARCHAR(50)[],
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 分镜表 ====================
CREATE TABLE storyboard_shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,
    shot_type VARCHAR(30),
    visual_prompt TEXT,
    reference_image_url TEXT,
    camera_movement VARCHAR(30),
    camera_angle VARCHAR(30),
    duration_seconds FLOAT,
    characters_in_shot VARCHAR(100)[],
    character_positions JSONB,
    audio_config JSONB,
    transition VARCHAR(30),
    generated_image_url TEXT,
    generated_video_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 音频轨表 ====================
CREATE TABLE audio_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    shot_id UUID REFERENCES storyboard_shots(id) ON DELETE SET NULL,
    type VARCHAR(20),
    name VARCHAR(200),
    file_url TEXT,
    duration_ms INTEGER,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    text_content TEXT,
    emotion VARCHAR(50),
    start_time_ms INTEGER,
    end_time_ms INTEGER,
    volume FLOAT DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Agent 会话表 ====================
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    agent_config JSONB,
    checkpoint_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Agent 消息表 ====================
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    agent_name VARCHAR(50),
    agent_type VARCHAR(30),
    content TEXT,
    structured_data JSONB,
    tool_calls JSONB,
    thinking JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 索引 ====================
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_episodes_project_id ON episodes(project_id);
CREATE INDEX idx_scenes_episode_id ON scenes(episode_id);
CREATE INDEX idx_beats_scene_id ON beats(scene_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_storyboard_shots_project_id ON storyboard_shots(project_id);
CREATE INDEX idx_storyboard_shots_scene_id ON storyboard_shots(scene_id);
CREATE INDEX idx_audio_tracks_project_id ON audio_tracks(project_id);
CREATE INDEX idx_agent_sessions_project_id ON agent_sessions(project_id);
CREATE INDEX idx_agent_messages_session_id ON agent_messages(session_id);
```

### 12.3 ChromaDB Collection Schema

```python
# Collection: project_memory
# 存储项目级别的所有文本记忆

collections = {
    "story_bible": {
        "description": "世界观设定集",
        "metadata_fields": ["project_id", "type", "category", "importance", "episode_range"],
    },
    "character_profiles": {
        "description": "角色档案",
        "metadata_fields": ["project_id", "type", "character_id", "character_name", "importance"],
    },
    "plot_summaries": {
        "description": "剧情摘要",
        "metadata_fields": ["project_id", "type", "episode", "characters_involved", "emotion_tags"],
    },
    "foreshadows": {
        "description": "伏笔记录",
        "metadata_fields": ["project_id", "type", "planted_episode", "resolved", "resolved_episode"],
    },
}
```

### 12.4 Neo4j 图模型定义

```cypher
// 节点类型
CREATE CONSTRAINT FOR (c:Character) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT FOR (p:Project) REQUIRE p.id IS UNIQUE;

// Character 节点属性
// {id, name, role_type, personality_tags, avatar_url, project_id}

// 关系类型
// Character -[:LOVES {intensity, start_ep}]-> Character
// Character -[:BETRAYS {reason, episode}]-> Character
// Character -[:FRIEND_OF {since}]-> Character
// Character -[:RIVAL_OF {reason}]-> Character
// Character -[:MENTOR_OF]-> Character
// Character -[:BELONGS_TO]-> Project
```

### 12.5 RESTful API 端点设计

#### 12.5.1 端点清单

```
# === 认证 ===
POST   /api/v1/auth/register              # 注册
POST   /api/v1/auth/login                 # 登录
POST   /api/v1/auth/refresh               # 刷新 Token
GET    /api/v1/auth/me                    # 获取当前用户

# === 项目 ===
GET    /api/v1/projects                   # 项目列表
POST   /api/v1/projects                   # 创建项目
GET    /api/v1/projects/{id}              # 项目详情
PUT    /api/v1/projects/{id}              # 更新项目
DELETE /api/v1/projects/{id}              # 删除项目
POST   /api/v1/projects/{id}/archive      # 归档项目

# === 角色 ===
GET    /api/v1/projects/{id}/characters   # 角色列表
POST   /api/v1/projects/{id}/characters   # 创建角色
GET    /api/v1/projects/{id}/characters/{cid}  # 角色详情
PUT    /api/v1/projects/{id}/characters/{cid}  # 更新角色
DELETE /api/v1/projects/{id}/characters/{cid}  # 删除角色

# === 剧本 ===
GET    /api/v1/projects/{id}/script       # 获取剧本
PUT    /api/v1/projects/{id}/script       # 更新剧本
POST   /api/v1/projects/{id}/script/export # 导出剧本
POST   /api/v1/projects/{id}/script/import # 导入剧本

# === 分镜 ===
GET    /api/v1/projects/{id}/storyboard   # 获取分镜板
POST   /api/v1/projects/{id}/storyboard/generate  # AI 生成分镜
PUT    /api/v1/projects/{id}/storyboard/shots/{sid}  # 更新镜头
POST   /api/v1/projects/{id}/storyboard/shots/{sid}/reference  # 上传参考图

# === 资产 ===
GET    /api/v1/projects/{id}/assets       # 资产列表
POST   /api/v1/projects/{id}/assets       # 上传资产
DELETE /api/v1/projects/{id}/assets/{aid}  # 删除资产
POST   /api/v1/projects/{id}/assets/generate  # AI 生成资产

# === 音频 ===
GET    /api/v1/projects/{id}/audio        # 音频轨列表
POST   /api/v1/projects/{id}/audio/tts    # 生成 TTS
POST   /api/v1/projects/{id}/audio/bgm    # 推荐/生成 BGM
POST   /api/v1/projects/{id}/audio/mix    # 混音

# === 视频 ===
POST   /api/v1/projects/{id}/video/generate  # 生成视频
GET    /api/v1/projects/{id}/video/status     # 生成状态

# === 导出 ===
POST   /api/v1/projects/{id}/export       # 创建导出任务
GET    /api/v1/projects/{id}/export/status # 导出状态
GET    /api/v1/projects/{id}/export/download # 下载

# === Agent ===
POST   /api/v1/agent/sessions             # 创建 Agent 会话
POST   /api/v1/agent/sessions/{sid}/message  # 发送消息
GET    /api/v1/agent/sessions/{sid}/messages # 获取消息历史
POST   /api/v1/agent/sessions/{sid}/feedback # 人类审核反馈

# === 记忆 ===
GET    /api/v1/projects/{id}/memory/search  # 记忆检索
POST   /api/v1/projects/{id}/memory/store   # 存储记忆

# === 设置 ===
GET    /api/v1/settings/api-keys          # 获取 API Key 列表（遮蔽）
PUT    /api/v1/settings/api-keys          # 更新 API Key
GET    /api/v1/settings/models            # 获取可用模型列表
```

#### 12.5.2 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    ...
  }
}
```

#### 12.5.3 错误码规范

| 错误码 | 说明              |
|:----|:----------------|
| 200 | 成功              |
| 201 | 创建成功            |
| 400 | 请求参数错误          |
| 401 | 未认证             |
| 403 | 无权限             |
| 404 | 资源不存在           |
| 409 | 资源冲突            |
| 422 | 数据验证失败          |
| 429 | 请求过于频繁          |
| 500 | 服务器内部错误         |
| 503 | 服务不可用（AI 模型不可达） |

### 12.6 WebSocket 实时通信协议

#### 12.6.1 连接地址

```
ws://localhost:8080/ws/agent/{session_id}
```

#### 12.6.2 消息类型

```json
// 客户端 → 服务端: 发送消息
{
  "type": "message",
  "payload": {
    "content": "把第3集的反转改得更狠一些",
    "target_agents": [
      "showrunner",
      "script_doctor"
    ],
    "context": {
      "episode": 3,
      "focus": "turning_point"
    }
  }
}

// 服务端 → 客户端: Agent 思考中
{
  "type": "agent_thinking",
  "agent": "showrunner",
  "payload": {
    "thought": "用户希望加强第3集的反转，让我先检索一下前面的剧情...",
    "tool_calls": [
      {
        "tool": "memory_retrieve",
        "args": {
          "query": "第1-2集剧情摘要"
        }
      }
    ]
  }
}

// 服务端 → 客户端: Agent 输出
{
  "type": "agent_output",
  "agent": "showrunner",
  "payload": {
    "content": "已调整第3集反转方案...",
    "structured_data": {
      ...
    }
  }
}

// 服务端 → 客户端: 人类审核请求
{
  "type": "human_review_required",
  "payload": {
    "question": "审稿 Agent 建议补充第2集的伏笔，是否同意？",
    "options": [
      "同意",
      "拒绝",
      "手动修改"
    ],
    "preview": {
      ...
    }
  }
}

// 服务端 → 客户端: 任务进度
{
  "type": "task_progress",
  "payload": {
    "task_type": "video_generation",
    "progress": 0.65,
    "message": "正在生成第5个镜头的视频..."
  }
}
```

#### 12.6.3 心跳与重连

- 客户端每 30 秒发送 `{"type": "ping"}`
- 服务端响应 `{"type": "pong"}`
- 连接断开后自动重连，间隔指数退避（1s, 2s, 4s, 8s, 最大 30s）
- 重连后自动恢复会话状态

---

## PART XIII — UI/UX 设计规范

### 13.1 设计语言与视觉风格

#### 13.1.1 设计理念

灵镜创影采用 **「电影剧本美学」(Screenplay Aesthetic)** 设计语言：

- 温暖的纸张色调，致敬传统剧本创作
- 衬线字体用于标题和文学性强调
- 等宽字体用于场景编号和元数据
- 沉稳的配色，避免过度花哨
- Agent 聊天区域使用柔和的气泡设计

#### 13.1.2 Design Token 定义

```css
:root {
  /* 色彩系统 */
  --bg: #F7F4EF;              /* 主背景 — 温暖米色 */
  --bg-card: #FFFDF9;         /* 卡片背景 — 接近白色 */
  --bg-sidebar: #EDE9E1;      /* 侧边栏 — 略深米色 */
  --bg-input: #FFFDF9;        /* 输入框背景 */
  --text-primary: #1C1917;    /* 主文字 — 深棕黑 */
  --text-secondary: #57534E;  /* 次要文字 — 中灰 */
  --text-muted: #A8A29E;      /* 弱化文字 — 浅灰 */
  --accent: #C53D3D;          /* 强调色 — 电影红 */
  --accent-hover: #A63232;    /* 强调色悬停 */
  --accent-light: #C53D3D15;  /* 强调色浅底 */
  --border: #D6D3D1;          /* 边框 */
  --border-light: #E7E5E4;    /* 浅边框 */

  /* 阴影 */
  --shadow: 0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04);
  --shadow-md: 0 4px 6px rgba(28,25,23,0.05), 0 2px 4px rgba(28,25,23,0.04);
  --shadow-lg: 0 10px 15px rgba(28,25,23,0.05), 0 4px 6px rgba(28,25,23,0.03);

  /* 圆角 */
  --radius: 4px;

  /* Agent 标识色 */
  --agent-showrunner: #8B5E3C;    /* 棕色 — 主笔 */
  --agent-worldbuilder: #3D6B5E;  /* 墨绿 — 设定 */
  --agent-character: #3D5A8B;     /* 靛蓝 — 角色 */
  --agent-scriptdoctor: #8B5C3D;  /* 赭石 — 审稿 */

  /* 剧本编辑器 */
  --scene-heading-bg: #F5F0E8;
  --scene-number: #A8A29E;
}
```

#### 13.1.3 字体系统

| 用途     | 字体                                                     | 说明   |
|:-------|:-------------------------------------------------------|:-----|
| 正文     | system-ui, 'Noto Sans SC', 'PingFang SC', sans-serif   | 通用正文 |
| 标题     | 'Noto Serif SC', 'Source Han Serif SC', Georgia, serif | 衬线标题 |
| 代码/元数据 | 'JetBrains Mono', 'Fira Code', Consolas, monospace     | 等宽字体 |

### 13.2 页面结构与导航

#### 13.2.1 信息架构

```
/ (Landing Page)
├── /login (登录)
├── /register (注册)
├── /projects (项目列表)
│   └── /projects/[id] (项目详情)
│       ├── /projects/[id]/workbench (工作台 — 默认)
│       │   ├── Agent 聊天面板
│       │   ├── 剧本编辑器
│       │   ├── 角色管理
│       │   ├── 分镜板
│       │   └── 时间线编辑器
│       ├── /projects/[id]/assets (资产管理)
│       └── /projects/[id]/export (导出)
├── /settings (设置)
│   ├── /settings/api-keys (API Key 配置)
│   ├── /settings/models (模型选择)
│   └── /settings/profile (个人信息)
└── /docs (文档)
```

#### 13.2.2 主导航

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 灵镜创影                    项目名    [设置] [用户头像]  │
├────────┬────────────────────────────────────────────────────┤
│        │                                                    │
│ 📋项目  │   ┌─────┬─────┬─────┬─────┬─────┐               │
│        │   │Agent│剧本 │角色 │分镜 │时间线│               │
│ ────── │   └─────┴─────┴─────┴─────┴─────┘               │
│ 最近    │                                                    │
│ 项目1   │   [工作区内容]                                     │
│ 项目2   │                                                    │
│ 项目3   │                                                    │
│        │                                                    │
│ ────── │                                                    │
│ ⚙设置  │                                                    │
│ 📖文档  │                                                    │
└────────┴────────────────────────────────────────────────────┘
```

### 13.3 核心页面设计

#### 13.3.1 项目列表页

```
┌─────────────────────────────────────────────────┐
│  我的项目                         [+ 新建项目]    │
├─────────────────────────────────────────────────┤
│  筛选: [全部] [进行中] [已完成] [已归档]          │
│  搜索: [________________]                        │
├─────────┬─────────┬─────────┬───────────────────┤
│ 逆袭女王 │ 古宅迷局 │ 甜蜜陷阱 │                    │
│ 都市/复仇 │ 悬疑/民国 │ 甜宠/都市 │                    │
│ 进行中   │ 草稿     │ 已完成   │                    │
│ 20集     │ 12集     │ 16集     │                    │
│ 60%     │ 10%     │ 100%    │                    │
│ [打开]   │ [打开]   │ [打开]   │                    │
└─────────┴─────────┴─────────┴───────────────────┘
```

#### 13.3.2 项目工作台

工作台是核心创作界面，采用多面板布局：

```
┌──────────────────────────────────────────────────────────────┐
│  项目: 逆袭女王  [Agent聊天] [剧本] [角色] [分镜] [时间线]     │
├──────────────────────┬───────────────────────────────────────┤
│                      │                                       │
│  Agent 聊天面板       │  主工作区                              │
│  (左侧面板, 30%)     │  (右侧面板, 70%)                      │
│                      │                                       │
│  ┌────────────────┐  │  [根据选中的 Tab 显示不同内容]          │
│  │ 🤖 Showrunner  │  │                                       │
│  │ 大纲已生成...   │  │  - 剧本 Tab: 富文本剧本编辑器          │
│  └────────────────┘  │  - 角色 Tab: 角色卡片列表              │
│  ┌────────────────┐  │  - 分镜 Tab: 分镜板/时间轴             │
│  │ 👤 用户        │  │  - 时间线 Tab: 视频/音频时间线          │
│  │ 写一个都市复仇  │  │                                       │
│  └────────────────┘  │                                       │
│                      │                                       │
│  [输入消息...]       │                                       │
│                      │                                       │
├──────────────────────┴───────────────────────────────────────┤
│  状态栏: Agent 状态 | 项目进度 | 导出按钮                      │
└──────────────────────────────────────────────────────────────┘
```

#### 13.3.3 设置页 — API Key 配置

```
┌─────────────────────────────────────────────────┐
│  设置                                            │
├─────────────────────────────────────────────────┤
│  [API Key 配置]  [模型选择]  [个人信息]           │
├─────────────────────────────────────────────────┤
│                                                 │
│  LLM 模型                                       │
│  ┌─────────────────────────────────────────┐    │
│  │ OpenAI API Key  [****abcd] [编辑] [测试] │    │
│  │ 阿里云 API Key  [****efgh] [编辑] [测试] │    │
│  │ DeepSeek Key    [未配置]   [配置]        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  图像生成                                        │
│  ┌─────────────────────────────────────────┐    │
│  │ Stable Diffusion [本地部署] [检查状态]    │    │
│  │ DALL-E API Key   [****ijkl] [编辑] [测试]│    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  视频生成                                        │
│  ┌─────────────────────────────────────────┐    │
│  │ 可灵 API Key     [未配置]   [配置]        │    │
│  │ Runway API Key   [未配置]   [配置]        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  TTS 语音                                        │
│  ┌─────────────────────────────────────────┐    │
│  │ Edge-TTS         [免费，无需配置]         │    │
│  │ Azure Speech Key [未配置]   [配置]        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 13.4 组件库规范

#### 13.4.1 通用组件

基于 shadcn/ui 扩展的业务组件：

| 组件       | 说明  | 扩展点                                 |
|:---------|:----|:------------------------------------|
| Button   | 按钮  | 增加 Agent 标识色变体                      |
| Card     | 卡片  | 增加软木板风格变体 (cork-texture)            |
| Dialog   | 对话框 | 增加全屏编辑模式                            |
| Tabs     | 标签页 | 增加垂直标签模式                            |
| Input    | 输入框 | 增加剧本格式输入                            |
| Badge    | 标签  | 增加状态标签（draft/in_progress/completed） |
| Progress | 进度条 | 增加 Pipeline 阶段进度                    |

#### 13.4.2 业务组件

| 组件                     | 说明                      |
|:-----------------------|:------------------------|
| `ScriptEditor`         | 剧本富文本编辑器，支持 6 种元素类型     |
| `AgentBubble`          | Agent 聊天气泡，带思考过程和工具调用展示 |
| `StoryboardCard`       | 分镜卡片，含缩略图和参数            |
| `Timeline`             | 时间线编辑器，视频/音频多轨          |
| `CharacterCard`        | 角色卡片，含头像和关键信息           |
| `SceneCard`            | 场景卡片，用于看板视图             |
| `VoiceProfileSelector` | 音色选择器，含预览播放             |
| `StyleTemplatePicker`  | 风格模板选择器，含预览             |
| `APIKeyInput`          | API Key 输入框，带加密和遮蔽      |

### 13.5 交互规范

#### 13.5.1 动画与过渡

```css
/* 淡入 */
.animate-fade-in { animation: fade-in 0.3s ease-out; }

/* 上滑 */
.animate-slide-up { animation: slide-up 0.25s ease-out; }

/* 右滑入 */
.animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }

/* 减少动画（无障碍） */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 13.5.2 加载状态

| 场景        | 加载方式                   |
|:----------|:-----------------------|
| 页面初始加载    | 骨架屏 (Skeleton)         |
| Agent 思考中 | 思考点动画 (.thinking-dots) |
| 视频生成中     | 进度条 + 百分比              |
| 数据提交中     | Button loading 状态      |
| 列表加载      | 3 行骨架屏                 |

#### 13.5.3 错误状态

| 场景          | 展示方式               |
|:------------|:-------------------|
| API 请求失败    | Toast 通知（右上角，自动消失） |
| Agent 执行错误  | 聊天气泡内红色错误提示        |
| API Key 未配置 | 设置页引导提示            |
| 网络断开        | 顶部黄色横幅提示           |

#### 13.5.4 空状态

| 场景        | 展示内容                  |
|:----------|:----------------------|
| 无项目       | 插图 + "创建你的第一个项目" 按钮   |
| 无角色       | 插图 + "让 AI 帮你设计角色" 按钮 |
| 无分镜       | 插图 + "从剧本生成分镜" 按钮     |
| Agent 无消息 | 欢迎语 + 快捷指令列表          |

### 13.6 无障碍设计

- 所有交互元素支持键盘导航 (Tab/Enter/Escape)
- 焦点状态使用 `focus-visible` 样式（2px accent 色 outline）
- 颜色对比度符合 WCAG AA 标准
- 图片提供 alt 文本
- 屏幕阅读器友好的 ARIA 标签
- 支持 `prefers-reduced-motion` 媒体查询

---

## PART XIV — 开发路线图

### 14.1 Phase 1: Agent 核心能力 MVP（第 1-2 月）

**目标**：验证 Agent 创意孵化核心能力，跑通最小闭环。

| 周次   | 交付物         | 具体内容                                                    |
|:-----|:------------|:--------------------------------------------------------|
| W1-2 | 项目脚手架       | Git 初始化、FastAPI 后端、Next.js 前端、PostgreSQL、Docker Compose |
| W3-4 | 单 Agent 基础版 | Showrunner Agent + 基础大纲生成 + ChromaDB 记忆存储               |
| W5-6 | 记忆系统        | ChromaDB 项目记忆 + 语义检索 + 设定集管理                            |
| W7-8 | 前端 MVP      | Agent 对话界面 + 大纲可视化 + 基础项目管理                             |

**Phase 1 交付标准**：

- ✅ 用户可通过对话描述创作意图
- ✅ Showrunner Agent 生成结构化大纲
- ✅ 用户可审核、修改、批准大纲
- ✅ Agent 具备项目记忆（检索已有设定）
- ✅ Web 界面可完成完整交互流程
- ✅ Docker Compose 一键启动

**Phase 1 不包含**：

- ❌ Multi-Agent 协作（仅单 Agent）
- ❌ 视频/音频 Pipeline
- ❌ Neo4j 图数据库
- ❌ 图像/视频生成

### 14.2 Phase 2: 多智能体与记忆攻坚（第 3-4 月）

**目标**：完成 Multi-Agent 协作，建立完整记忆系统。

| 周次     | 交付物         | 具体内容                                           |
|:-------|:------------|:-----------------------------------------------|
| W9-10  | Multi-Agent | 设定 Agent + 角色 Agent + 审稿 Agent 上线              |
| W11-12 | Agent 协作编排  | DeepAgents StateGraph 完整编排 + Human-in-the-Loop |
| W13-14 | 图谱记忆        | Neo4j 集成 + 人物关系图谱 + 可视化                        |
| W15-16 | 工具链扩展       | 逻辑校验 + 格式转换 + 剧本导入                             |

**Phase 2 交付标准**：

- ✅ 4 个 Agent 协作完成剧本创作
- ✅ HITL 审核节点正常工作
- ✅ Neo4j 人物关系图谱可查询和可视化
- ✅ 支持 txt/docx 文件导入剧本
- ✅ 剧本版本对比功能

### 14.3 Phase 3: Pipeline 与视觉生成（第 5-6 月）

**目标**：打通视觉管线，实现从分镜到视频的生成。

| 周次     | 交付物       | 具体内容                                   |
|:-------|:----------|:---------------------------------------|
| W17-18 | 剧本解析 + 分镜 | LLM 结构化解析 + 分镜自动生成 + 可视化编辑器            |
| W19-20 | 角色与场景生成   | StyleForge 角色立绘 + 场景背景 + 风格模板          |
| W21-22 | 漫剧模式      | MotionCore 漫剧 Pipeline（图层拆分 + 动画 + 特效） |
| W23-24 | 短剧模式      | I2V/T2V 接入 + R2V 角色一致性                 |

**Phase 3 交付标准**：

- ✅ 剧本自动生成分镜板
- ✅ AI 生成角色立绘和场景背景
- ✅ 漫剧模式可生成动态漫画视频
- ✅ 短剧模式可生成 I2V 视频片段
- ✅ 角色跨镜头面部一致性 > 80%

### 14.4 Phase 4: 音频系统与导出（第 7-8 月）

**目标**：完成音频管线和最终导出。

| 周次     | 交付物     | 具体内容                                |
|:-------|:--------|:------------------------------------|
| W25-26 | TTS 配音  | VoiceStage 多引擎 TTS + 角色声音绑定 + 时间轴对齐 |
| W27-28 | BGM 与音效 | SoundGen BGM 推荐 + 音效库 + 自动混音        |
| W29-30 | 口型同步    | MuseTalk 集成 + 音频驱动口型                |
| W31-32 | 导出系统    | 视频导出 + 字幕导出 + 批量导出                  |

**Phase 4 交付标准**：

- ✅ 对白自动生成语音并绑定角色
- ✅ BGM 自动匹配场景情绪
- ✅ 音效自动叠加
- ✅ 口型同步正常工作
- ✅ 支持 MP4/MOV 导出，最高 4K

### 14.5 Phase 5: 优化与打磨（第 9-10 月）

**目标**：提升质量、性能优化、用户体验打磨。

| 周次     | 交付物   | 具体内容                      |
|:-------|:------|:--------------------------|
| W33-34 | 质量优化  | 角色一致性提升 + 视频质量优化 + 音频质量优化 |
| W35-36 | 性能优化  | 渲染性能 + 缓存策略 + 数据库优化       |
| W37-38 | 用户体验  | 交互优化 + 错误处理 + 引导流程        |
| W39-40 | 文档与测试 | 用户文档 + API 文档 + E2E 测试    |

**Phase 5 交付标准**：

- ✅ 角色一致性 > 90%
- ✅ 视频生成速度优化 30%+
- ✅ 完整的用户文档和 API 文档
- ✅ 核心流程 E2E 测试覆盖

### 14.6 各阶段交付标准总览

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5
  MVP        多Agent      视觉管线     音频管线     优化打磨
  (2月)      (2月)        (2月)       (2月)       (2月)

里程碑:
M1: 单Agent + 大纲生成 + 前端MVP
M2: 4-Agent协作 + Neo4j + 剧本导入
M3: 分镜生成 + 角色生成 + 漫剧模式 + I2V
M4: TTS配音 + BGM + 口型同步 + 导出
M5: 质量优化 + 性能优化 + 文档完善
```

### 14.7 技术债务管理策略

| 策略                    | 说明               |
|:----------------------|:-----------------|
| **每 Phase 预留 20% 时间** | 用于处理技术债务和意外问题    |
| **代码审查**              | 所有 PR 必须经过审查     |
| **测试覆盖**              | 核心模块单元测试覆盖 > 80% |
| **文档同步**              | 代码变更必须同步更新文档     |
| **依赖更新**              | 每月检查依赖版本，及时更新    |
| **性能基线**              | 建立性能基线，每次发布前对比   |

---

## PART XV — 附录

### 附录 A: 完整 JSON Schema 汇总

#### A.1 StoryOutline Schema

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "genre": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "logline": {
      "type": "string"
    },
    "themes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "episodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "episodeNumber": {
            "type": "integer"
          },
          "title": {
            "type": "string"
          },
          "summary": {
            "type": "string"
          },
          "keyEvents": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "cliffhanger": {
            "type": "string"
          }
        }
      }
    },
    "mainPlotPoints": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "turningPoints": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "title",
    "episodes"
  ]
}
```

#### A.2 Character Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "roleType": {
      "type": "string",
      "enum": [
        "protagonist",
        "antagonist",
        "supporting",
        "minor"
      ]
    },
    "description": {
      "type": "string"
    },
    "personality": {
      "type": "object",
      "properties": {
        "traits": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "strength": {
          "type": "string"
        },
        "weakness": {
          "type": "string"
        }
      }
    },
    "appearance": {
      "type": "string"
    },
    "backstory": {
      "type": "string"
    },
    "arcDescription": {
      "type": "string"
    },
    "dialogueStyle": {
      "type": "string"
    },
    "visualPrompt": {
      "type": "string"
    }
  },
  "required": [
    "name"
  ]
}
```

#### A.3 StoryboardShot Schema

```json
{
  "type": "object",
  "properties": {
    "shotId": {
      "type": "string"
    },
    "shotType": {
      "type": "string",
      "enum": [
        "establishing",
        "action",
        "dialogue",
        "reaction",
        "montage"
      ]
    },
    "visualPrompt": {
      "type": "string"
    },
    "camera": {
      "type": "object",
      "properties": {
        "movement": {
          "type": "string"
        },
        "angle": {
          "type": "string"
        },
        "durationSeconds": {
          "type": "number"
        }
      }
    },
    "charactersInShot": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "audio": {
      "type": "object",
      "properties": {
        "dialogueLines": {
          "type": "array"
        },
        "bgmMood": {
          "type": "string"
        },
        "sfx": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "transition": {
      "type": "string"
    }
  }
}
```

### 附录 B: Prompt 模板库

#### B.1 Showrunner System Prompt

```
你是灵镜创影的主笔编剧 (Showrunner)。
你是一位经验丰富的短剧/网文编剧总监，擅长把控故事主线、节奏和主题。
你的目标是创作出"开局抓人、中段紧凑、结尾有余味"的优质剧本。

## 约束
- 短剧每集时长 1-3 分钟，总集数 8-100 集
- 前 3 集必须完成核心冲突建立和"钩子"设置
- 每集结尾必须有悬念或反转
```

#### B.2 WorldBuilder System Prompt

```
你是灵镜创影的设定架构师 (WorldBuilder)。
你负责构建故事的世界观，确保设定的逻辑自洽性。
你需要为每个场景生成详细的环境描述，包括时代背景、地理位置、社会结构、氛围标签。
```

#### B.3 CharacterDesigner System Prompt

```
你是灵镜创影的角色设计师 (CharacterDesigner)。
你负责设计角色的完整档案，包括外貌、性格、背景故事、动机、恐惧、秘密。
你需要设计角色的性格弧光（起点→转折→终点）和人物关系网。
你需要为每个角色生成详细的视觉描述 Prompt，用于下游图像生成。
```

#### B.4 ScriptDoctor System Prompt

```
你是灵镜创影的审稿医生 (ScriptDoctor)。
你负责校验剧本的逻辑一致性、节奏合理性、角色行为动机。
你需要检查伏笔是否回收、设定是否冲突、钩子是否足够强。
你需要给出具体的修改建议，而不是笼统的评价。
```

#### B.5 分镜生成 Prompt

```
将以下剧本场景转换为分镜描述。
每个 Beat 生成一个或多个 Shot，指定：
- 景别 (wide/medium/close/extreme_close)
- 机位 (eye_level/high_angle/low_angle/bird_eye)
- 运镜 (static/push_in/pull_out/pan/follow)
- 视觉描述 Prompt (英文，用于 AI 生图)
- 预估时长 (秒)
```

### 附录 C: 第三方服务接入清单

| 类别       | 服务                 | 用途        | API Key 环境变量         |
|:---------|:-------------------|:----------|:---------------------|
| **LLM**  | OpenAI (GPT-4o)    | 复杂推理      | `OPENAI_API_KEY`     |
|          | 阿里云 (Qwen-Max)     | 主力创作      | `DASHSCOPE_API_KEY`  |
|          | Anthropic (Claude) | 长文本分析     | `ANTHROPIC_API_KEY`  |
|          | DeepSeek           | 高性价比备选    | `DEEPSEEK_API_KEY`   |
| **图像生成** | Stable Diffusion   | 本地部署      | 无需                   |
|          | DALL-E 3           | 快速概念图     | `OPENAI_API_KEY`     |
|          | 可灵 (Kling)         | 中国风写实     | `KLING_API_KEY`      |
| **视频生成** | 可灵 (Kling)         | I2V/T2V   | `KLING_API_KEY`      |
|          | Runway             | 电影质感      | `RUNWAY_API_KEY`     |
|          | CogVideoX          | 本地部署      | 无需                   |
| **TTS**  | Edge-TTS           | 免费多语种     | 无需                   |
|          | CosyVoice          | 中文优秀      | 本地无需                 |
|          | GPT-SoVITS         | 声音克隆      | 本地无需                 |
|          | Azure Speech       | 商业级       | `AZURE_SPEECH_KEY`   |
|          | ElevenLabs         | 英文最佳      | `ELEVENLABS_API_KEY` |
| **BGM**  | Suno               | AI 生成 BGM | `SUNO_API_KEY`       |
|          | MusicGen           | 本地部署      | 无需                   |
| **音效**   | AudioCraft         | 本地部署      | 无需                   |
| **监控**   | LangSmith          | Agent 追踪  | `LANGSMITH_API_KEY`  |

### 附录 D: 竞品功能对比矩阵

| 功能      | 灵镜创影           | Runway | Pika   | 可灵     | Sora   |
|:--------|:---------------|:-------|:-------|:-------|:-------|
| AI 剧本创作 | ✅ Multi-Agent  | ❌      | ❌      | ❌      | ❌      |
| 分镜自动生成  | ✅              | ❌      | ❌      | ❌      | ❌      |
| 角色一致性   | ✅ R2V + FaceID | ⚠️ 有限  | ⚠️ 有限  | ✅      | ⚠️ 未知  |
| 漫剧模式    | ✅ 图层动画         | ❌      | ❌      | ❌      | ❌      |
| TTS 配音  | ✅ 多引擎          | ❌      | ❌      | ❌      | ❌      |
| BGM 生成  | ✅ AI 推荐/生成     | ❌      | ❌      | ❌      | ❌      |
| 开源自部署   | ✅ Apache 2.0   | ❌      | ❌      | ❌      | ❌      |
| 本地运行    | ✅ Docker       | ❌ SaaS | ❌ SaaS | ❌ SaaS | ❌ SaaS |

### 附录 E: 术语中英对照表

| 中文     | 英文                             | 缩写     |
|:-------|:-------------------------------|:-------|
| 灵镜创影   | FrameMind Studio               | -      |
| 剧本工厂   | ScriptMind                     | -      |
| 形象工坊   | StyleForge                     | -      |
| 智能分镜   | StoryboardAI                   | -      |
| 视频合成引擎 | MotionCore                     | -      |
| 声演剧场   | VoiceStage                     | -      |
| 音效智选   | SoundGen                       | -      |
| 人工智能代理 | AI Agent                       | Agent  |
| 生产管线   | Pipeline                       | -      |
| 参考图转视频 | Reference-to-Video             | R2V    |
| 图像转视频  | Image-to-Video                 | I2V    |
| 文本转视频  | Text-to-Video                  | T2V    |
| 面部特征标识 | Face ID                        | FaceID |
| 文本转语音  | Text-to-Speech                 | TTS    |
| 音效     | Sound Effects                  | SFX    |
| 背景音乐   | Background Music               | BGM    |
| 大语言模型  | Large Language Model           | LLM    |
| 人类参与循环 | Human-in-the-Loop              | HITL   |
| 检索增强生成 | Retrieval-Augmented Generation | RAG    |
| 向量数据库  | Vector Database                | -      |
| 图数据库   | Graph Database                 | -      |
| 任务队列   | Task Queue                     | -      |
| 对象存储   | Object Storage                 | -      |

### 附录 F: 后端架构拆分分析 — Java Spring Boot vs Python 全栈

> 本附录记录了关于是否将后端拆分为 Java Spring Boot（业务层）+ Python DeepAgents（AI 引擎）双栈架构的评估结论，为未来架构迭代提供决策参考。

#### F.1 背景

当前架构采用**纯 Python 栈**：FastAPI 同时承担 REST API 网关和 Agent 编排职责，DeepAgents（LangChain/LangGraph）嵌入同一进程。评估是否有必要引入
Java Spring Boot 作为独立的业务后端，将 Python 限定为纯 AI 引擎。

#### F.2 评估方案

**方案 A：保持纯 Python 栈（当前方案）**

```
前端 (Next.js) → FastAPI (API + Agent 编排) → DeepAgents → 数据层
```

**方案 B：全量拆分**

```
前端 (Next.js) → Java Spring Boot (API + 业务逻辑) → Python DeepAgents (AI 引擎) → 数据层
```

**方案 C：轻量拆分（折中）**

```
前端 (Next.js) → Nginx
                   ├→ Spring Boot: 用户管理 / 认证 / 权限
                   └→ FastAPI: Agent 编排 / Pipeline / AI 全部逻辑
```

#### F.3 对比分析

| 维度          | 方案 A (纯 Python) | 方案 B (全量拆分)    | 方案 C (轻量拆分) |
|:------------|:----------------|:---------------|:------------|
| 运维复杂度       | ⭐ 低             | ⭐⭐⭐ 高          | ⭐⭐ 中        |
| 开发效率（小团队）   | ⭐ 高             | ⭐ 低            | ⭐⭐ 中        |
| AI 生态集成     | ⭐ 原生            | ⭐⭐ 需跨语言调用      | ⭐ 原生        |
| CRUD 性能     | ⭐⭐ 够用           | ⭐ 更优           | ⭐⭐ 够用       |
| 企业级特性       | ⭐ 基础            | ⭐⭐⭐ 完善         | ⭐⭐ 中        |
| Docker 镜像体积 | ⭐ 小 (~150MB)    | ⭐⭐ 大 (~350MB+) | ⭐⭐ 中        |
| 贡献者门槛       | ⭐ 低             | ⭐⭐ 高           | ⭐⭐ 中        |
| 扩缩容灵活性      | ⭐ 单体            | ⭐⭐ 独立扩缩        | ⭐⭐ 独立扩缩     |

#### F.4 当前后端职责清单

梳理当前后端实际承担的工作，判断复杂度是否需要引入 Java：

| 职责            | 复杂度   | 说明                               |
|:--------------|:------|:---------------------------------|
| 用户认证（JWT）     | 低     | FastAPI + passlib/jose 完全胜任      |
| 项目/角色/剧本 CRUD | 低     | 标准 RESTful，无复杂业务规则               |
| 资产管理（MinIO）   | 低     | S3 SDK 调用，Python/Java 无差异        |
| Agent 编排      | **高** | DeepAgents/LangGraph 深度绑定 Python |
| RAG 检索        | **高** | ChromaDB + LangChain，Python 原生   |
| Pipeline 调度   | 中     | Celery + Redis，Python 生态成熟       |
| WebSocket 推送  | 低     | FastAPI 原生支持                     |
| 视频/音频处理       | 中     | FFmpeg 调用，Python subprocess 足够   |

**结论：当前 CRUD 逻辑轻量，AI 逻辑占比大且深度绑定 Python。**

#### F.5 决策结论

**当前阶段（MVP / 小团队 / 开源）：采用方案 A，保持纯 Python 栈。**

核心理由：

1. **复杂度不匹配**：当前业务逻辑简单，引入 Spring Boot 属于过度工程
2. **AI 生态绑定**：DeepAgents 的工具调用、记忆管理、状态图均深度依赖 Python，跨语言调用增加延迟和故障点
3. **开发者体验**：开源项目贡献者通常熟悉 Python 全栈，双栈提高贡献门槛
4. **资源占用**：JRE 镜像额外 ~200MB，对自托管用户的硬件要求更高
5. **调试效率**：单体内调试远比跨服务分布式调试高效

**在 FastAPI 内部做好分层设计，为未来可能的拆分预留接口：**

```
FastAPI (单体内部分层)
├── Router 层    — HTTP 路由、参数校验、响应格式化
├── Service 层   — 业务逻辑（项目管理、角色管理、资产服务）
├── Agent 层     — AI 编排（DeepAgents、RAG、Prompt 管理）
└── Repository 层 — 数据访问（SQLAlchemy、Redis、ChromaDB）
```

Service 层和 Agent 层之间通过明确的接口解耦，未来若需拆分，Service 层可平移至 Spring Boot，Agent 层保持 Python 不变。

#### F.6 未来拆分触发条件

当以下条件**满足 2 项及以上**时，重新评估拆分方案：

| 条件           | 说明                       |
|:-------------|:-------------------------|
| 团队规模 ≥ 5 人   | 有专职 Java 后端开发者，双栈维护成本可接受 |
| 需要企业级集成      | LDAP/SSO/审计日志/合规要求       |
| 业务逻辑复杂化      | 多租户、权限矩阵、工作流审批等          |
| 并发量 > 500 在线 | Java JVM 的高并发优势开始体现      |
| 需要微服务治理      | 服务网格、熔断限流、分布式事务          |

若触发拆分，推荐采用**方案 C（轻量拆分）**：Spring Boot 仅负责用户体系和认证，其余全部留在 Python 栈。

---

> **文档结束** — 灵镜创影 (FrameMind Studio) 产品设计规格书 V1.0
>
> 本文档定义了灵镜创影的完整产品设计，涵盖 8 大功能模块、AI Agent 系统、技术架构、数据模型、API 接口、UI/UX 规范和开发路线图。
>
> 如有疑问或建议，请在项目 GitHub Issues 中提出。
