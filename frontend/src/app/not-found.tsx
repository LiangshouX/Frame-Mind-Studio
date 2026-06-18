import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-mono text-6xl font-bold text-[var(--text-muted)] mb-4">404</h1>
        <p className="text-[var(--text-secondary)] mb-6">页面不存在</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded hover:bg-[var(--accent-dark)]"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
