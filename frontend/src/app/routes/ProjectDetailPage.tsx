import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi, endpointsApi, scansApi } from '../../services/api'
import type { Project, Endpoint, Scan, DiscoveryRequest } from '../../types/api'
import { Button, Card, Input, LoadingSpinner, ErrorMessage, Table, Select } from '../../components/ui'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = parseInt(id!)

  const [project, setProject] = useState<Project | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showDiscovery, setShowDiscovery] = useState(false)
  const [discoveryData, setDiscoveryData] = useState<DiscoveryRequest>({
    openapi_url: '',
    crawl: false,
    probe_common_paths: false,
  })

  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!id || Number.isNaN(projectId)) {
      setError('Invalid project id')
      setProject(null)
      setEndpoints([])
      setScans([])
      setLoading(false)
      return
    }
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load project first
      const projectRes = await projectsApi.get(projectId)
      setProject(projectRes.data)
      setError(null)
      
      // Load endpoints with 404 handling
      try {
        const endpointsRes = await endpointsApi.list(projectId)
        setEndpoints(endpointsRes.data)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setEndpoints([])
        } else {
          console.error('Failed to load endpoints:', err)
        }
      }
      
      // Load scans with 404 handling
      try {
        const scansRes = await scansApi.list(projectId)
        setScans(scansRes.data)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setScans([])
        } else {
          console.error('Failed to load scans:', err)
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Project not found. Check the URL or create a project first.')
        setProject(null)
        setEndpoints([])
        setScans([])
      } else {
        setError(err.message || 'Failed to load project data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await projectsApi.discover(projectId, discoveryData)
      setShowDiscovery(false)
      setDiscoveryData({ openapi_url: '', crawl: false, probe_common_paths: false })
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Discovery failed')
    }
  }

  const handleStartScan = async () => {
    try {
      setScanning(true)
      await scansApi.create({ project_id: projectId })
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start scan')
    } finally {
      setScanning(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!project) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
            ← Back to Projects
          </Link>
        </div>
        <ErrorMessage message={error || 'Project not found'} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Back to Projects
        </Link>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>{project.name}</h2>
        <p style={{ color: '#666', margin: '0.5rem 0' }}>
          <strong>Base URL:</strong> {project.base_url}
        </p>
        <p style={{ color: '#666', margin: '0.5rem 0' }}>
          <strong>Created:</strong> {new Date(project.created_at).toLocaleString()}
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Button onClick={() => setShowDiscovery(!showDiscovery)}>
            {showDiscovery ? 'Cancel Discovery' : 'Discover Endpoints'}
          </Button>
          <Button onClick={handleStartScan} disabled={scanning || endpoints.length === 0}>
            {scanning ? 'Starting...' : 'Start Scan'}
          </Button>
        </div>
      </Card>

      {error && <ErrorMessage message={error} />}

      {showDiscovery && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Discover Endpoints</h3>
          <form onSubmit={handleDiscover}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                OpenAPI/Swagger URL (optional)
              </label>
              <Input
                value={discoveryData.openapi_url}
                onChange={(e) => setDiscoveryData({ ...discoveryData, openapi_url: e.target.value })}
                placeholder="https://api.example.com/openapi.json"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={discoveryData.crawl}
                  onChange={(e) => setDiscoveryData({ ...discoveryData, crawl: e.target.checked })}
                />
                Enable crawling
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={discoveryData.probe_common_paths}
                  onChange={(e) => setDiscoveryData({ ...discoveryData, probe_common_paths: e.target.checked })}
                />
                Probe common paths
              </label>
            </div>
            <Button type="submit">Start Discovery</Button>
          </form>
        </Card>
      )}

      <h3>Endpoints ({endpoints.length})</h3>
      {endpoints.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No endpoints discovered yet. Use the "Discover Endpoints" button above.
          </p>
        </Card>
      ) : (
        <Card style={{ marginBottom: '2rem' }}>
          <Table>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Method</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Path</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: endpoint.method === 'GET' ? '#4caf50' : 
                                 endpoint.method === 'POST' ? '#2196f3' :
                                 endpoint.method === 'PUT' ? '#ff9800' :
                                 endpoint.method === 'DELETE' ? '#f44336' : '#9e9e9e',
                      color: 'white',
                    }}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{endpoint.path}</td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {new Date(endpoint.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link to={`/projects/${projectId}/endpoints/${endpoint.id}`}>
                      <Button variant="secondary">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <h3>Recent Scans ({scans.length})</h3>
      {scans.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No scans yet. Start a scan to test all endpoints.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Started</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Completed</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{scan.id}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      background: scan.status === 'completed' ? '#4caf50' : 
                                 scan.status === 'in_progress' ? '#ff9800' : '#9e9e9e',
                      color: 'white',
                    }}>
                      {scan.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {new Date(scan.started_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {scan.completed_at ? new Date(scan.completed_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link to={`/projects/${projectId}/scans/${scan.id}`}>
                      <Button variant="secondary">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
