import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import MainContent from './components/layout/MainContent'
import type { ActiveModule, FullAnalysisResponse } from './types/analysis'

function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('player')
  const [analysisData] = useState<FullAnalysisResponse | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
        <MainContent activeModule={activeModule} analysisData={analysisData} />
      </div>
    </div>
  )
}

export default App
