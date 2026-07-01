import type { ActiveModule } from '../../types/analysis'

interface SidebarProps {
  activeModule: ActiveModule
  onModuleChange: (m: ActiveModule) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems: Array<{ key: ActiveModule; icon: string; label: string }> = [
  { key: 'player', icon: '🎵', label: '播放器' },
  { key: 'quality', icon: '📊', label: '质量检测' },
  { key: 'spectrum', icon: '📈', label: '频谱分析' },
  { key: 'waveform', icon: '🔊', label: '波形显示' },
  { key: 'channel', icon: '🔀', label: '声道分析' },
  { key: 'info', icon: 'ℹ️', label: '音频信息' },
]

export default function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full shrink-0 select-none transition-all duration-200"
      style={{
        width: collapsed ? 56 : 180,
        backgroundColor: '#010409',
        borderRight: '1px solid #30363d',
      }}
    >
      <nav className="flex-1 pt-3 pb-2">
        {navItems.map((item) => {
          const active = activeModule === item.key
          return (
            <button
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors cursor-pointer border-0 bg-transparent"
              style={{
                color: active ? '#e94560' : '#8b949e',
                backgroundColor: active ? '#1f2937' : 'transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = '#e6edf3'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = '#8b949e'
              }}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center px-3 py-3 text-sm cursor-pointer border-0 bg-transparent"
        style={{ color: '#8b949e', borderTop: '1px solid #30363d' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#e6edf3' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e' }}
      >
        {collapsed ? '▶' : '◀ 收起'}
      </button>
    </aside>
  )
}
