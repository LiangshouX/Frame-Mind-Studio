import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import {
  Clapperboard,
  FileText,
  Users,
  ChevronRight,
  ArrowRight,
  Mic2,
  Layers,
  Workflow,
  Pen,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-14">
        {/* Hero — screenplay-formatted */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--accent)]" />
          <div className="max-w-5xl mx-auto px-6 py-24 md:py-36">
            {/* Scene heading */}
            <div className="font-mono text-xs tracking-[0.2em] text-[var(--text-muted)] uppercase mb-8">
              INT. 创作工作室 — 白天
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.15] tracking-tight text-[var(--text-primary)] mb-6">
              AI 短剧创作
              <br />
              <span className="text-[var(--accent)]">工作台</span>
            </h1>

            {/* Action line */}
            <p className="max-w-xl text-lg text-[var(--text-secondary)] leading-relaxed mb-10">
              四个专业 AI Agent 坐在编剧桌对面，和你一起打磨剧本。
              从灵感到分镜，每一步都有对戏的搭档。
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium rounded hover:bg-[var(--ink-700)] transition-colors"
              >
                打开工作台
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] text-sm rounded hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
              >
                了解流程
              </a>
            </div>
          </div>
        </section>

        {/* How It Works — call-sheet style */}
        <section id="how-it-works" className="border-t border-[var(--border-light)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-3">
              工作流程
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-12">
              从创意到成片的四个工位
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="group flex gap-5 p-5 rounded border border-[var(--border-light)] bg-[var(--bg-card)] hover:border-[var(--border)] hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded bg-[var(--bg-sidebar)] font-mono text-sm font-bold text-[var(--text-secondary)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold mb-1">{step.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agents — character cards with dialogue-style names */}
        <section className="border-t border-[var(--border-light)] bg-[var(--bg-card)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-3">
              创作团队
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              四位 Agent，四种专长
            </h2>
            <p className="text-[var(--text-secondary)] mb-12 max-w-lg">
              每位 Agent 扮演编剧桌上的一个角色。你写，他们对戏。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="relative p-5 rounded border border-[var(--border-light)] bg-[var(--bg)] hover:shadow-md transition-all group"
                >
                  {/* Agent color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                    style={{ backgroundColor: agent.color }}
                  />
                  <div className="pl-3">
                    {/* Character name — dialogue format */}
                    <div
                      className="font-mono text-xs font-bold tracking-[0.1em] uppercase mb-1"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mb-3">{agent.role}</div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                      {agent.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — action-line descriptions */}
        <section className="border-t border-[var(--border-light)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-3">
              核心能力
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-12">
              不只是生成，是协作
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="p-5 rounded border border-[var(--border-light)] bg-[var(--bg-card)]">
                  <f.icon className="h-5 w-5 text-[var(--text-secondary)] mb-3" />
                  <h3 className="font-display text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border-light)] bg-[var(--text-primary)]">
          <div className="max-w-5xl mx-auto px-6 py-20 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--bg)] mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-[var(--ink-300)] mb-8 max-w-md mx-auto">
              创建一个项目，让 AI Agent 坐到编剧桌对面。
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white text-sm font-medium rounded hover:bg-[var(--accent-dark)] transition-colors"
            >
              创建第一个项目
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border-light)] py-8">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Clapperboard className="h-3.5 w-3.5" />
              <span>AI-DramaForge</span>
            </div>
            <div>
              Next.js · Spring Boot · LangGraph · ChromaDB
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

const steps = [
  {
    title: '提出创意',
    description: '用一句话描述你的短剧想法。主笔 Agent 会拆解成三幕结构，规划集数和钩子点。',
  },
  {
    title: '构建世界',
    description: '设定 Agent 搭建场景、时间线、社会规则。角色 Agent 同步设计人物档案和关系网。',
  },
  {
    title: '打磨剧本',
    description: '在结构化编辑器里逐场逐句调整。审稿 Agent 实时检查逻辑漏洞和节奏问题。',
  },
  {
    title: '导出成片',
    description: '生成分镜提示词、配音脚本、字幕文件。对接视频合成流水线。',
  },
]

const agents = [
  {
    name: 'Showrunner',
    role: '主笔 · 编剧总监',
    description: '把控故事主线和节奏。生成大纲、规划集数、设置反转点。用三幕剧和救猫咪节拍保证结构扎实。',
    skills: ['三幕剧结构', '救猫咪节拍', '黄金三章', '钩子设计'],
    color: '#8B5E3C',
  },
  {
    name: 'WorldBuilder',
    role: '设定 · 架构师',
    description: '构建世界观和场景。维护设定一致性，检测逻辑冲突，管理场景库。',
    skills: ['世界观构建', '场景设计', '设定冲突检测', '时间线管理'],
    color: '#3D6B5E',
  },
  {
    name: 'CharacterDesigner',
    role: '角色 · 设计师',
    description: '设计角色档案卡、性格弧光、人物关系网。为每个角色生成台词风格模板。',
    skills: ['性格弧光', '关系图谱', '台词风格', '动机分析'],
    color: '#3D5A8B',
  },
  {
    name: 'ScriptDoctor',
    role: '审稿 · 剧本医生',
    description: '逐场检查逻辑漏洞、节奏拖沓、台词生硬。用爆款元素清单优化剧本。',
    skills: ['逻辑校验', '节奏分析', '伏笔管理', '爆款元素'],
    color: '#8B5C3D',
  },
]

const features = [
  {
    icon: Pen,
    title: '结构化剧本编辑器',
    description: '场景标题、动作描写、角色对白分区编辑。Tab 切换元素类型，Enter 新建段落，像真正的编剧软件一样工作。',
  },
  {
    icon: Layers,
    title: '看板式场景管理',
    description: '场景卡片拖拽排列，按幕次分组，一目了然地掌控故事结构。双击进入详情编辑。',
  },
  {
    icon: Workflow,
    title: '实时 Agent 对话',
    description: 'Agent 思考过程透明可见。支持 @指定Agent、附带选中文本、查看工具调用记录。',
  },
]
