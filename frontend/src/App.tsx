import { useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import MainContent from './components/layout/MainContent'
import FileUpload from './components/upload/FileUpload'
import type { ActiveModule, FullAnalysisResponse } from './types/analysis'

type ThemeMode = 'dark' | 'light'

function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('player')
  const [analysisData, setAnalysisData] = useState<FullAnalysisResponse | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('music-analyzer-theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('music-analyzer-theme', theme)
  }, [theme])

  function handleUploadComplete(data: FullAnalysisResponse) {
    setAnalysisData(data)
    setError(null)
    setActiveModule('quality')
  }

  function handleError(msg: string) {
    setError(msg)
  }

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          basicInfo={analysisData?.basic_info}
          fileId={analysisData?.file_id}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />
        {!analysisData ? (
          <main className="flex-1 overflow-auto p-5 flex flex-col items-center justify-center">
            {error && (
              <div className="mb-4 px-4 py-2 rounded text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 12%, var(--bg-panel))', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)' }}>
                {error}
              </div>
            )}
            <FileUpload onUploadComplete={handleUploadComplete} onError={handleError} />
          </main>
        ) : (
          <>
            {error && (
              <div className="mx-5 mt-3 px-4 py-2 rounded text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 12%, var(--bg-panel))', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)' }}>
                {error}
              </div>
            )}
            <MainContent activeModule={activeModule} analysisData={analysisData} />
          </>
        )}
      </div>
    </div>
  )
}

export default App
