# OpenClaw Skills 手动安装说明

本目录包含 FrameMind 影视平台的 OpenClaw Skill 定义。

## 部署步骤

1. 将本目录下的 Skill 文件夹复制到 OpenClaw 实例的 Skills 目录中
2. 或通过 OpenClaw UI 手动导入每个 Skill
3. 重启 OpenClaw Gateway 使 Skill 生效

## Skill 列表

| Skill | 描述 | 目录 |
|-------|------|------|
| 剧本生成 | 根据梗概和角色信息生成剧本片段 | `screenplay-generate/` |
| 角色分析 | 分析角色性格、关系和发展弧线 | `character-analysis/` |
| 大纲规划 | 根据世界观和梗概规划故事大纲 | `outline-plan/` |

## 注意事项

- 每个 Skill 包含 `skill.json`（元数据）和 `prompt.md`（Prompt 模板）
- Skill 修改后需要重新安装到 OpenClaw 实例
- 确保 OpenClaw 的 LLM 配置与项目使用的模型一致
