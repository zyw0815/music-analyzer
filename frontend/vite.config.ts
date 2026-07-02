import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/zrender/')) return 'zrender'
          if (id.includes('/node_modules/echarts/lib/chart/')) return 'echarts-charts'
          if (id.includes('/node_modules/echarts/lib/component/')) return 'echarts-components'
          if (id.includes('/node_modules/echarts/lib/coord/')) return 'echarts-coord'
          if (id.includes('/node_modules/echarts/lib/visual/')) return 'echarts-visual'
          if (id.includes('/node_modules/echarts/lib/processor/')) return 'echarts-processor'
          if (id.includes('/node_modules/echarts/lib/label/')) return 'echarts-label'
          if (id.includes('/node_modules/echarts/lib/')) return 'echarts-core'
          if (id.includes('/node_modules/echarts/')) return 'echarts'
        },
      },
    },
  },
  server: {
    port: 9211,
    proxy: {
      '/api': 'http://localhost:9220',
    },
  },
})
