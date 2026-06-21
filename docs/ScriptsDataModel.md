
**微短剧**与**传统影视**两套专为“AI剧本生成”优化的数据模型。

在AI应用中，**微短剧的核心是“情绪与节拍（Beat）”**，而**传统影视的核心是“结构与格式块（Block）”**。因此，两者的底层数据抽象有显著差异。

---

### 一、 微短剧结构（情绪驱动模型）

微短剧不强调复杂的场景调度，而是极度依赖**“情节点（Beat）”**来控制观众的情绪起伏（如：压抑 -> 爆发 -> 爽）。因此，数据模型将 `Beat` 作为核心生成单元，AI在生成时只需关注当前Beat的情绪任务。

#### 1.1 层级结构

```text
ShortDramaProject (微短剧项目)
├── projectId: string (项目ID)
├── title: string (剧名)
├── genre: string (题材，如：霸总、复仇、战神)
├── tags: string[] (细分标签，如：带球跑、真假千金)
├── logline: string (一句话梗概)
├── characters: Character[] (人物小传，作为AI全局System Prompt)
│   ├── characterId: string
│   ├── name: string
│   ├── roleType: string (主角/配角/反派)
│   └── persona: string (人设特征与记忆点)
└── episodes: Episode[] (分集，短剧核心单元)
    ├── episodeNumber: integer (集数)
    ├── title: string (分集标题)
    ├── highlight: string (本集看点/爽点)
    ├── hook: string (结尾钩子/Hook，指导AI生成悬念)
    ├── targetDurationSeconds: integer (目标时长)
    └── scenes: Scene[] (场次，通常1集仅1-2场)
        ├── sceneId: string
        ├── intExt: string (内景/外景)
        ├── location: string (地点)
        ├── time: string (时间)
        └── beats: Beat[] (节拍/情节点，AI生成的最小逻辑单元)
            ├── beatId: string
            ├── beatType: string (受辱/打脸/掉马甲/误会/反转)
            ├── summary: string (节拍简述，给AI的Prompt)
            ├── visualAction: string (画面动作描述)
            ├── dialogues: Dialogue[] (该节拍内的对白)
            │   ├── characterName: string (角色名)
            │   ├── parenthetical: string (情绪/动作提示)
            │   └── line: string (台词)
            └── emotionArc: string (情绪起伏变化，如：憋屈->爆发)
```

#### 1.2 JSON Schema 完整定义

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "微短剧项目数据模型",
  "properties": {
    "projectId": { "type": "string", "description": "项目唯一ID" },
    "title": { "type": "string", "description": "剧名" },
    "genre": { "type": "string", "description": "题材（如：霸总、复仇、战神）" },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "细分标签"
    },
    "logline": { "type": "string", "description": "一句话梗概" },
    "characters": {
      "type": "array",
      "description": "人物小传",
      "items": {
        "type": "object",
        "properties": {
          "characterId": { "type": "string" },
          "name": { "type": "string" },
          "roleType": { "type": "string", "enum": ["主角", "配角", "反派", "龙套"] },
          "persona": { "type": "string", "description": "人设特征与记忆点" }
        },
        "required": ["characterId", "name", "roleType"]
      }
    },
    "episodes": {
      "type": "array",
      "description": "分集列表",
      "items": {
        "type": "object",
        "properties": {
          "episodeNumber": { "type": "integer", "description": "集数" },
          "title": { "type": "string", "description": "分集标题" },
          "highlight": { "type": "string", "description": "本集看点/爽点" },
          "hook": { "type": "string", "description": "结尾钩子（Hook），吸引下一集" },
          "targetDurationSeconds": { "type": "integer", "description": "目标时长（秒）" },
          "scenes": {
            "type": "array",
            "description": "场次列表",
            "items": {
              "type": "object",
              "properties": {
                "sceneId": { "type": "string" },
                "intExt": { "type": "string", "enum": ["内景", "外景", "内外景"] },
                "location": { "type": "string", "description": "地点" },
                "time": { "type": "string", "description": "时间（如：日、夜、晨）" },
                "beats": {
                  "type": "array",
                  "description": "节拍/情节点列表",
                  "items": {
                    "type": "object",
                    "properties": {
                      "beatId": { "type": "string" },
                      "beatType": { 
                        "type": "string", 
                        "enum": ["受辱", "打脸", "掉马甲", "误会", "反转", "悬念", "其他"], 
                        "description": "短剧特有节拍类型，用于精准控制AI情绪生成" 
                      },
                      "summary": { "type": "string", "description": "节拍简述" },
                      "visualAction": { "type": "string", "description": "画面动作描述" },
                      "dialogues": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "characterName": { "type": "string" },
                            "parenthetical": { "type": "string", "description": "情绪/动作提示" },
                            "line": { "type": "string", "description": "台词" }
                          },
                          "required": ["characterName", "line"]
                        }
                      },
                      "emotionArc": { "type": "string", "description": "该节拍的情绪起伏变化" }
                    },
                    "required": ["beatId", "beatType", "summary"]
                  }
                }
              },
              "required": ["sceneId", "location", "time", "beats"]
            }
          }
        },
        "required": ["episodeNumber", "highlight", "hook", "scenes"]
      }
    }
  },
  "required": ["projectId", "title", "genre", "logline", "episodes"]
}
```

---

### 二、 传统影视结构（结构与格式驱动模型）

传统影视（电影/长剧）遵循严格的工业标准（如好莱坞三幕剧、Fountain剧本格式）。AI不仅要写故事，还要**输出符合导演和演员阅读习惯的排版**。因此，数据模型引入了 `Act`、`Sequence` 进行宏观控制，并用 `Block` 进行微观格式控制。

#### 2.1 层级结构

```text
TraditionalScript (传统影视剧本)
├── projectId: string (项目ID)
├── title: string (剧名)
├── genre: string (类型，如：悬疑、科幻)
├── logline: string (一句话梗概)
├── synopsis: string (故事大纲)
├── structureModel: string (结构模型：三幕剧 / 英雄之旅)
├── characters: Character[] (人物小传)
│   ├── characterId: string
│   ├── name: string
│   ├── roleType: string (主角/配角/反派)
│   ├── background: string (背景故事与动机)
│   └── arc: string (人物成长弧光)
└── acts: Act[] (幕，宏观结构)
    ├── actNumber: integer (幕序号，1/2/3)
    ├── actName: string (建置 / 对抗 / 解决)
    ├── actGoal: string (本幕核心戏剧目标)
    └── sequences: Sequence[] (序列，中观结构)
        ├── sequenceId: string
        ├── sequenceName: string (触发事件 / 灵魂黑夜 / 高潮)
        ├── plotPoint: string (核心情节点/转折)
        └── scenes: Scene[] (场次，微观结构)
            ├── sceneId: string
            ├── slugline: string (场景标题，如：内景. 咖啡馆 - 日)
            ├── intExt: string (内景/外景)
            ├── location: string (地点)
            ├── timeOfDay: string (时间)
            ├── charactersPresent: string[] (出场人物)
            ├── sceneObjective: string (本场戏的戏剧目标/冲突)
            └── blocks: Block[] (内容块，AI排版输出的最小单元)
                ├── blockId: string
                ├── blockType: string (action / character / dialogue / parenthetical / transition)
                ├── content: string (文本正文)
                └── characterName: string (关联角色名，仅对白/角色名块需要)
```

#### 2.2 JSON Schema 完整定义

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "传统影视剧本数据模型",
  "properties": {
    "projectId": { "type": "string", "description": "项目唯一ID" },
    "title": { "type": "string", "description": "剧名" },
    "genre": { "type": "string", "description": "类型（如：悬疑、爱情、科幻）" },
    "logline": { "type": "string", "description": "一句话梗概" },
    "synopsis": { "type": "string", "description": "故事大纲" },
    "structureModel": { 
      "type": "string", 
      "enum": ["三幕剧", "英雄之旅", "起承转合"], 
      "description": "底层结构模型" 
    },
    "characters": {
      "type": "array",
      "description": "人物小传",
      "items": {
        "type": "object",
        "properties": {
          "characterId": { "type": "string" },
          "name": { "type": "string" },
          "roleType": { "type": "string", "enum": ["主角", "配角", "反派", "龙套"] },
          "background": { "type": "string", "description": "背景故事与人物动机" },
          "arc": { "type": "string", "description": "人物成长弧光" }
        },
        "required": ["characterId", "name", "roleType"]
      }
    },
    "acts": {
      "type": "array",
      "description": "幕（如三幕剧的第一幕、第二幕、第三幕）",
      "items": {
        "type": "object",
        "properties": {
          "actNumber": { "type": "integer", "description": "幕序号" },
          "actName": { "type": "string", "description": "幕名称（如：建置、对抗、解决）" },
          "actGoal": { "type": "string", "description": "本幕核心戏剧目标" },
          "sequences": {
            "type": "array",
            "description": "序列（如：触发事件、灵魂黑夜、高潮）",
            "items": {
              "type": "object",
              "properties": {
                "sequenceId": { "type": "string" },
                "sequenceName": { "type": "string", "description": "序列名称" },
                "plotPoint": { "type": "string", "description": "核心情节点/转折" },
                "scenes": {
                  "type": "array",
                  "description": "场次列表",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sceneId": { "type": "string" },
                      "slugline": { "type": "string", "description": "场景标题（如：内景. 咖啡馆 - 日）" },
                      "intExt": { "type": "string", "enum": ["内景", "外景", "内外景"] },
                      "location": { "type": "string" },
                      "timeOfDay": { "type": "string" },
                      "charactersPresent": {
                        "type": "array",
                        "items": { "type": "string" }
                      },
                      "sceneObjective": { "type": "string", "description": "本场戏的戏剧目标/冲突" },
                      "blocks": {
                        "type": "array",
                        "description": "内容块（遵循Fountain/标准剧本格式）",
                        "items": {
                          "type": "object",
                          "properties": {
                            "blockId": { "type": "string" },
                            "blockType": { 
                              "type": "string", 
                              "enum": ["action", "character", "dialogue", "parenthetical", "transition"], 
                              "description": "块类型，决定前端渲染的缩进和字体样式" 
                            },
                            "content": { "type": "string", "description": "文本正文" },
                            "characterName": { "type": "string", "description": "关联角色名（仅对白/角色名块需要）" }
                          },
                          "required": ["blockId", "blockType", "content"]
                        }
                      }
                    },
                    "required": ["sceneId", "slugline", "blocks"]
                  }
                }
              },
              "required": ["sequenceId", "sequenceName", "scenes"]
            }
          }
        },
        "required": ["actNumber", "actName", "sequences"]
      }
    }
  },
  "required": ["projectId", "title", "structureModel", "acts"]
}
```

### 💡 针对AI工程化的落地建议：
1. **Prompt组装策略**：在生成 `Beat` 或 `Block` 时，**不要**把整个剧本喂给大模型。应动态拼装：`[全局人物小传] + [当前幕目标] + [当前场次冲突] + [上一个Beat的结局]`，这样能极大降低AI的幻觉，防止人物OOC（崩人设）。
2. **前端渲染映射**：传统影视的 `blockType` 可以直接映射到开源剧本格式 **Fountain** 语法。例如 `blockType: "character"` 渲染为全大写居中，`blockType: "dialogue"` 渲染为居中缩进，这样应用可以直接导出行业标准 `.fdx` 或 `.fountain` 文件。