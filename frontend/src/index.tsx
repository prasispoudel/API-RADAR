import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import ProjectsPage from './app/routes/ProjectsPage'
import ProjectDetailPage from './app/routes/ProjectDetailPage'
import EndpointDetailPage from './app/routes/EndpointDetailPage'
import ScanDetailPage from './app/routes/ScanDetailPage'
import AnomaliesPage from './app/routes/AnomaliesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:projectId/endpoints/:endpointId" element={<EndpointDetailPage />} />
          <Route path="projects/:projectId/scans/:scanId" element={<ScanDetailPage />} />
          <Route path="anomalies" element={<AnomaliesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
