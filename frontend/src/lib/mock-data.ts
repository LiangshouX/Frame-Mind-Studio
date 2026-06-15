import type { Project, Character, Script, AgentMessage, StoryOutline } from '@/types'

export const mockProjects: Project[] = [
  {
    id: 'proj_001',
    title: '逆袭女王',
    description: '现代都市复仇短剧，女主被渣男背叛后逆袭',
    genre: ['都市', '复仇', '逆袭'],
    status: 'in_progress',
    targetEpisodes: 20,
    targetDurationMinutes: 2.5,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-13T10:00:00Z',
  },
  {
    id: 'proj_002',
    title: '古宅迷局',
    description: '民国悬疑短剧，年轻女记者卷入诡异事件',
    genre: ['悬疑', '民国', '惊悚'],
    status: 'draft',
    targetEpisodes: 12,
    createdAt: '2026-05-15T08:00:00Z',
    updatedAt: '2026-05-15T08:00:00Z',
  },
  {
    id: 'proj_003',
    title: '甜蜜陷阱',
    description: '都市甜宠短剧，两个年轻人的浪漫邂逅',
    genre: ['甜宠', '都市', '喜剧'],
    status: 'completed',
    targetEpisodes: 16,
    createdAt: '2026-04-01T12:00:00Z',
    updatedAt: '2026-05-28T18:00:00Z',
  },
]

export const mockCharacters: Character[] = [
  {
    id: 'char_001',
    project_id: 'proj_001',
    name: '林晚秋',
    role_type: 'protagonist',
    roleType: 'protagonist',
    description: '28岁，互联网公司产品经理，外表温柔但内心坚韧',
    personality: {
      traits: ['坚韧', '聪明', '隐忍'],
      strength: '超强的学习能力',
      weakness: '过于信任他人',
    },
    backstory: '普通家庭出身，凭借努力考入名校，毕业后进入头部互联网公司。在公司遇到了男友陈昊，以为找到了真爱。',
    arc: '从被背叛的弱者成长为独当一面的女强人',
    dialogue_style: '前期温和隐忍，后期果断干练',
    created_at: '2026-06-01T10:00:00Z',
    createdAt: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'char_002',
    project_id: 'proj_001',
    name: '陈昊',
    role_type: 'antagonist',
    roleType: 'antagonist',
    description: '30岁，公司副总裁，表面精英实则野心勃勃',
    personality: {
      traits: ['虚伪', '野心', '精明'],
      strength: '社交手腕',
      weakness: '贪婪',
    },
    backstory: '富二代出身，靠家族关系上位，觊觎公司控制权。利用林晚秋的感情窃取商业机密。',
    arc: '从表面的成功人士到最终身败名裂',
    dialogue_style: '温文尔雅的外表下暗藏锋芒',
    created_at: '2026-06-01T10:00:00Z',
    createdAt: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'char_003',
    project_id: 'proj_001',
    name: '苏瑶',
    role_type: 'antagonist',
    roleType: 'antagonist',
    description: '27岁，林晚秋的闺蜜，实则是陈昊的棋子',
    personality: {
      traits: ['嫉妒', '善变', '自卑'],
      strength: '察言观色',
      weakness: '嫉妒心强',
    },
    backstory: '从小活在林晚秋的光环下，表面是闺蜜，内心充满嫉妒。被陈昊利用。',
    arc: '从嫉妒的闺蜜到最终醒悟悔过',
    dialogue_style: '甜言蜜语，话中有话',
    created_at: '2026-06-01T10:00:00Z',
    createdAt: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
]

export const mockScript: Script = {
  id: 'script_001',
  project_id: 'proj_001',
  version: 1,
  status: 'draft',
  content: {
    title: '逆袭女王',
    totalEpisodes: 20,
    episodes: [
      {
        episodeNumber: 1,
        title: '坠落',
        durationMinutes: 2.5,
        scenes: [
          {
            sceneId: 's01e01_sc01',
            location: '高档写字楼-会议室',
            time: '白天',
            moodTags: ['紧张', '压抑'],
            charactersPresent: ['林晚秋', '陈昊'],
            beats: [
              { beatId: 'b01', type: 'action', content: '晚秋正在汇报Q3产品方案', durationSeconds: 15 },
              { beatId: 'b02', type: 'dialogue', character: '陈昊', content: '这个方案不行，推翻重来。', emotion: '轻蔑', durationSeconds: 5 },
            ],
          },
        ],
      },
    ],
  },
  created_at: '2026-06-01T10:00:00Z',
  createdAt: '2026-06-01T10:00:00Z',
  updated_at: '2026-06-13T10:00:00Z',
  updatedAt: '2026-06-13T10:00:00Z',
}

export const mockOutline: StoryOutline = {
  title: '逆袭女王 - 故事大纲',
  genre: ['都市', '复仇', '逆袭'],
  logline: '被渣男背叛的女产品经理，从谷底逆袭为商业女王',
  themes: ['复仇', '女性成长', '职场逆袭'],
  episodes: [
    { episodeNumber: 1, title: '坠落', summary: '年会上被当众羞辱，发现男友与闺蜜的背叛', cliffhanger: '晚秋意外发现陈昊的商业阴谋' },
    { episodeNumber: 2, title: '觉醒', summary: '意外获得关键信息，开始隐忍布局', cliffhanger: '一个神秘人向她伸出援手' },
    { episodeNumber: 3, title: '首次反击', summary: '精准反击，让对手措手不及', cliffhanger: '更大的阴谋浮出水面' },
  ],
}

export const mockAgentMessages: AgentMessage[] = [
  {
    id: 'msg_001',
    session_id: 'session_001',
    role: 'user',
    content: '写一个现代都市复仇短剧，女主被渣男背叛后逆袭',
    createdAt: '2026-06-13T10:00:00Z',
    created_at: '2026-06-13T10:00:00Z',
  },
  {
    id: 'msg_002',
    session_id: 'session_001',
    role: 'assistant',
    agentName: 'showrunner',
    agent_type: 'showrunner',
    content: `好的，我来为您构思这个短剧的大纲。

## 📋 故事大纲：《逆袭女王》

**题材**: 都市 · 复仇 · 逆袭
**集数**: 20集
**每集时长**: 2-3分钟

### 核心设定
女主林晚秋是一名互联网公司产品经理，被男友陈昊和闺蜜苏瑶联手背叛。从谷底崛起，她用智慧和勇气完成了华丽逆袭。

### 黄金三章结构
- **第1集【受辱】**: 年会上被当众羞辱，发现背叛
- **第2集【觉醒】**: 获得关键信息，开始隐忍布局
- **第3集【打脸】**: 首次精准反击，让对手措手不及

---

*请审阅大纲，我可以安排其他 Agent 进一步完善世界观和角色设定。*`,
    thinking: [
      { type: 'reasoning', content: '用户想要都市复仇题材，需要把握"爽感"节奏' },
      { type: 'plan', content: '采用黄金三章结构，前3集完成受辱-觉醒-打脸闭环' },
    ],
    createdAt: '2026-06-13T10:01:00Z',
    created_at: '2026-06-13T10:01:00Z',
  },
]
