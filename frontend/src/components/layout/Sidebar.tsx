import type { ActiveModule } from '../../types/analysis'

interface SidebarProps {
  activeModule: ActiveModule
  onModuleChange: (m: ActiveModule) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems: Array<{ key: ActiveModule; icon: string; label: string }> = [
  { key: 'player', icon: '▶', label: '播放器' },
  { key: 'quality', icon: '◆', label: '质量检测' },
  { key: 'spectrum', icon: '⌁', label: '频谱分析' },
  { key: 'waveform', icon: '≋', label: '波形显示' },
  { key: 'channel', icon: '↔', label: '声道分析' },
  { key: 'info', icon: 'i', label: '音频信息' },
]

export default function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full shrink-0 select-none transition-all duration-200"
      style={{
        width: collapsed ? 56 : 180,
        backgroundColor: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="px-3 py-4">
        <div
          className="h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent), var(--accent-strong), var(--orange))',
            opacity: collapsed ? 0.9 : 1,
          }}
        />
      </div>
      <nav className="flex-1 px-2 pb-2">
        {navItems.map((item) => {
          const active = activeModule === item.key
          return (
            <button
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors cursor-pointer border-0 rounded-md"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontWeight: active ? 700 : 500,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <span className="flex h-6 w-6 items-center justify-center text-sm">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center px-3 py-3 text-sm cursor-pointer border-0 bg-transparent"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        {collapsed ? '›' : '‹ 收起'}
      </button>
    </aside>
  )
}
