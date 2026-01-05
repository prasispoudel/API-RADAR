import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { endpointsApi, anomaliesApi } from '../../services/api'
import type { Endpoint, TestRun, Anomaly } from '../../types/api'
import { Button, Card, LoadingSpinner, ErrorMessage, Table } from '../../components/ui'

export default function EndpointDetailPage() {
  const { projectId, endpointId } = useParams<{ projectId: string; endpointId: string }>()
  const epId = parseInt(endpointId!)

  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [runs, setRuns] = useState<TestRun[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    if (!endpointId || Number.isNaN(epId)) {
      setError('Invalid endpoint id')
      setEndpoint(null)
      setRuns([])
      setAnomalies([])
      setLoading(false)
      return
    }
    loadData()
  }, [epId])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load endpoint first
      const endpointRes = await endpointsApi.get(epId)
      setEndpoint(endpointRes.data)
      setError(null)
      
      // Load runs with 404 handling
      try {
        const runsRes = await endpointsApi.listRuns(epId)
        setRuns(runsRes.data)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setRuns([])
        } else {
          console.error('Failed to load runs:', err)
        }
      }
      
      // Load anomalies with 404 handling
      try {
        const anomaliesRes = await anomaliesApi.listByEndpoint(epId)
        setAnomalies(anomaliesRes.data)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setAnomalies([])
        } else {
          console.error('Failed to load anomalies:', err)
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Endpoint not found')
        setEndpoint(null)
        setRuns([])
        setAnomalies([])
      } else {
        setError(err.message || 'Failed to load endpoint data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleComputeAnomalies = async () => {
    try {
      setComputing(true)
      await anomaliesApi.computeForEndpoint(epId)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compute anomalies')
    } finally {
      setComputing(false)
    }
  }

  if (loading) return <LoadingSpinner />
  
  if (!endpoint) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <Link to={`/projects/${projectId}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
            ← Back to Project
          </Link>
        </div>
        <ErrorMessage message={error || `Endpoint ${endpointId} not found`} />
      </div>
    )
  }
  
  if (error && !endpoint) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <Link to={`/projects/${projectId}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
            ← Back to Project
          </Link>
        </div>
        <ErrorMessage message={error} />
      </div>
    )
  }

  const avgResponseTime = runs.length > 0
    ? (runs.reduce((sum, r) => sum + r.response_time, 0) / runs.length).toFixed(2)
    : 'N/A'

  const successRate = runs.length > 0
    ? ((runs.filter(r => r.success).length / runs.length) * 100).toFixed(1)
    : 'N/A'

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={`/projects/${projectId}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Back to Project
        </Link>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginRight: '0.5rem',
                background: endpoint.method === 'GET' ? '#4caf50' : 
                           endpoint.method === 'POST' ? '#2196f3' :
                           endpoint.method === 'PUT' ? '#ff9800' :
                           endpoint.method === 'DELETE' ? '#f44336' : '#9e9e9e',
                color: 'white',
              }}>
                {endpoint.method}
              </span>
              <span style={{ fontFamily: 'monospace' }}>{endpoint.path}</span>
            </h2>
          </div>
          <Button onClick={handleComputeAnomalies} disabled={computing || runs.length === 0}>
            {computing ? 'Computing...' : 'Compute Anomalies'}
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Runs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{runs.length}</div>
          </div>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Avg Response Time</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{avgResponseTime} ms</div>
          </div>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Success Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{successRate}%</div>
          </div>
        </div>
      </Card>

      {error && <ErrorMessage message={error} />}

      {anomalies.length > 0 && (
        <>
          <h3>Anomalies ({anomalies.length})</h3>
          <Card style={{ marginBottom: '2rem' }}>
            <Table>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Severity</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Details</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Detected</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>{anomaly.anomaly_type}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        background: anomaly.severity === 'high' ? '#f44336' :
                                   anomaly.severity === 'medium' ? '#ff9800' : '#4caf50',
                        color: 'white',
                      }}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{anomaly.details}</td>
                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                      {new Date(anomaly.detected_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      <h3>Test Runs ({runs.length})</h3>
      {runs.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No test runs yet. Start a scan to test this endpoint.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Response Time</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status Code</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Executed</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 50).map((run) => (
                <tr key={run.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      background: run.success ? '#4caf50' : '#f44336',
                      color: 'white',
                    }}>
                      {run.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{run.response_time.toFixed(2)} ms</td>
                  <td style={{ padding: '0.75rem' }}>{run.status_code}</td>
                  <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                    {new Date(run.executed_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#f44336', fontSize: '0.875rem' }}>
                    {run.error_message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {runs.length > 50 && (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '1rem', fontSize: '0.875rem' }}>
              Showing 50 of {runs.length} runs
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
