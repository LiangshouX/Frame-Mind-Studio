import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Clapperboard, ChevronRight, ArrowRight, Layers, Workflow, Pen } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-14">
        {/* Hero — 清爽的纸币米白底，50元青绿点缀 */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--gold)] to-[var(--accent)]" />
          <div className="max-w-5xl mx-auto px-6 py-28 md:py-40">
            <div className="font-mono text-sm tracking-[0.2em] text-[var(--accent)] uppercase mb-6">
              INT. 创作工作室 — 白天
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-[var(--text-primary)] mb-8">
              AI 微电影创作
              <br />
              <span className="text-[var(--accent)]">工作台</span>
            </h1>

            <p className="max-w-xl text-xl text-[var(--text-secondary)] leading-relaxed mb-12">
              四个专业 AI Agent 坐在编剧桌对面，和你一起打磨剧本。
              从灵感到分镜，每一步都有对戏的搭档。
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/projects"
                className="btn btn-primary text-base px-8 py-3"
              >
                打开工作台
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-secondary text-base px-8 py-3"
              >
                了解流程
              </a>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-24">
            <div className="font-mono text-sm tracking-[0.15em] text-[var(--accent)] uppercase mb-4">
              工作流程
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-14 text-[var(--text-primary)]">
              从创意到成片的四个工位
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {steps.map((step, i) => (
                <div key={step.title} className="group flex gap-6 p-6 card">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--bg-surface)] font-mono text-lg font-bold text-[var(--text-muted)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-2 text-[var(--text-primary)]">{step.title}</h3>
                    <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agents — 10元蓝黑底色区域 */}
        <section className="border-t border-[var(--border)]" style={{ backgroundColor: '#1c2b33' }}>
          <div className="max-w-5xl mx-auto px-6 py-24">
            <div className="font-mono text-sm tracking-[0.15em] uppercase mb-4" style={{ color: '#8a949b' }}>
              创作团队
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: '#f5f0e6' }}>
              四位 Agent，四种专长
            </h2>
            <p className="text-lg mb-14 max-w-lg" style={{ color: '#8a949b' }}>
              每位 Agent 扮演编剧桌上的一个角色。你写，他们对戏。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="relative p-6 rounded-xl border transition-all group"
                  style={{ backgroundColor: '#243640', borderColor: '#2d4250' }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                    style={{ backgroundColor: agent.color }}
                  />
                  <div className="pl-4">
                    <div
                      className="font-mono text-sm font-bold tracking-[0.1em] uppercase mb-1"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </div>
                    <div className="text-sm mb-4" style={{ color: '#8a949b' }}>{agent.role}</div>
                    <p className="text-base leading-relaxed mb-5" style={{ color: '#c8d0d5' }}>
                      {agent.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: '#2d4250', color: '#8a949b' }}
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

        {/* Features */}
        <section className="border-t border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-24">
            <div className="font-mono text-sm tracking-[0.15em] text-[var(--accent)] uppercase mb-4">
              核心能力
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-14 text-[var(--text-primary)]">
              不只是生成，是协作
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="p-6 card">
                  <f.icon className="h-6 w-6 text-[var(--accent)] mb-4" />
                  <h3 className="font-display text-lg font-bold mb-3 text-[var(--text-primary)]">{f.title}</h3>
                  <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — 50元青绿 */}
        <section className="border-t border-[var(--border)] bg-[var(--accent)]">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-5">
              准备好开始了吗？
            </h2>
            <p className="text-white/80 mb-10 max-w-md mx-auto text-lg">
              创建一个项目，让 AI Agent 坐到编剧桌对面。
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[var(--accent)] text-base font-bold rounded-lg hover:bg-white/90 transition-colors"
            >
              创建第一个项目
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] py-10 bg-[var(--bg-card)]">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Clapperboard className="h-4 w-4 text-[var(--accent)]" />
              <span>Frame Mind Studio</span>
            </div>
            <div>Next.js · Spring Boot · AgentScope-Java · PostgreSQL</div>
          </div>
        </footer>
      </main>
    </>
  )
}

const steps = [
  { title: '提出创意', description: '用一句话描述你的短剧想法。主笔 Agent 会拆解成三幕结构，规划集数和钩子点。' },
  { title: '构建世界', description: '设定 Agent 搭建场景、时间线、社会规则。角色 Agent 同步设计人物档案和关系网。' },
  { title: '打磨剧本', description: '在结构化编辑器里逐场逐句调整。审稿 Agent 实时检查逻辑漏洞和节奏问题。' },
  { title: '导出成片', description: '生成分镜提示词、配音脚本、字幕文件。对接视频合成流水线。' },
]

const agents = [
  { name: 'Showrunner', role: '主笔 · 编剧总监', description: '把控故事主线和节奏。生成大纲、规划集数、设置反转点。', skills: ['三幕剧结构', '救猫咪节拍', '钩子设计'], color: '#dc2626' },
  { name: 'WorldBuilder', role: '设定 · 架构师', description: '构建世界观和场景。维护设定一致性，检测逻辑冲突。', skills: ['世界观构建', '场景设计', '设定冲突检测'], color: '#22a06b' },
  { name: 'CharacterDesigner', role: '角色 · 设计师', description: '设计角色档案卡、性格弧光、人物关系网。', skills: ['性格弧光', '关系图谱', '台词风格'], color: '#7c3aed' },
  { name: 'ScriptDoctor', role: '审稿 · 剧本医生', description: '逐场检查逻辑漏洞、节奏拖沓、台词生硬。', skills: ['逻辑校验', '节奏分析', '伏笔管理'], color: '#b8941f' },
]

const features = [
  { icon: Pen, title: '结构化剧本编辑器', description: '场景标题、动作描写、角色对白分区编辑。Tab 切换元素类型。' },
  { icon: Layers, title: '看板式场景管理', description: '场景卡片拖拽排列，按幕次分组，一目了然地掌控故事结构。' },
  { icon: Workflow, title: '实时 Agent 对话', description: 'Agent 思考过程透明可见。支持查看工具调用记录。' },
]
