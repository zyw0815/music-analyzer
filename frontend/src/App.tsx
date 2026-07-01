import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import MainContent from './components/layout/MainContent'
import FileUpload from './components/upload/FileUpload'
import type { ActiveModule, FullAnalysisResponse } from './types/analysis'

function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('player')
  const [analysisData, setAnalysisData] = useState<FullAnalysisResponse | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleUploadComplete(data: FullAnalysisResponse) {
    setAnalysisData(data)
    setError(null)
    setActiveModule('quality')
  }

  function handleError(msg: string) {
    setError(msg)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#0d1117' }}>
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar basicInfo={analysisData?.basic_info} />
        {!analysisData ? (
          <main className="flex-1 overflow-auto p-5 flex flex-col items-center justify-center" style={{ backgroundColor: '#0d1117' }}>
            {error && (
              <div className="mb-4 px-4 py-2 rounded text-sm" style={{ backgroundColor: '#2d1b1b', color: '#f85149', border: '1px solid #f8514933' }}>
                {error}
              </div>
            )}
            <FileUpload onUploadComplete={handleUploadComplete} onError={handleError} />
          </main>
        ) : (
          <>
            {error && (
              <div className="mx-5 mt-3 px-4 py-2 rounded text-sm" style={{ backgroundColor: '#2d1b1b', color: '#f85149', border: '1px solid #f8514933' }}>
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
