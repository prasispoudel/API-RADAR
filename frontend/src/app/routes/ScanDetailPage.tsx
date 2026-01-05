import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { scansApi } from '../../services/api'
import type { Scan, TestRun } from '../../types/api'
import { Card, LoadingSpinner, ErrorMessage, Table } from '../../components/ui'

export default function ScanDetailPage() {
  const { projectId, scanId } = useParams<{ projectId: string; scanId: string }>()
  const sId = parseInt(scanId!)

  const [scan, setScan] = useState<Scan | null>(null)
  const [runs, setRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [sId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [scanRes, runsRes] = await Promise.all([
        scansApi.get(sId),
        scansApi.getRuns(sId),
      ])
      setScan(scanRes.data)
      setRuns(runsRes.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load scan data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!scan) return <ErrorMessage message="Scan not found" />

  const successCount = runs.filter(r => r.success).length
  const failCount = runs.length - successCount
  const avgResponseTime = runs.length > 0
    ? (runs.reduce((sum, r) => sum + r.response_time, 0) / runs.length).toFixed(2)
    : 'N/A'

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={`/projects/${projectId}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Back to Project
        </Link>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Scan #{scan.id}</h2>
        <div style={{ marginBottom: '1rem' }}>
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
        </div>
        <p style={{ color: '#666', margin: '0.5rem 0' }}>
          <strong>Started:</strong> {new Date(scan.started_at).toLocaleString()}
        </p>
        {scan.completed_at && (
          <p style={{ color: '#666', margin: '0.5rem 0' }}>
            <strong>Completed:</strong> {new Date(scan.completed_at).toLocaleString()}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Runs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{runs.length}</div>
          </div>
          <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#2e7d32' }}>Successful</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#2e7d32' }}>
              {successCount}
            </div>
          </div>
          <div style={{ padding: '1rem', background: '#ffebee', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#c62828' }}>Failed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#c62828' }}>
              {failCount}
            </div>
          </div>
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Avg Response</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{avgResponseTime} ms</div>
          </div>
        </div>
      </Card>

      {error && <ErrorMessage message={error} />}

      <h3>Test Runs ({runs.length})</h3>
      {runs.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No test runs in this scan.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Endpoint</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Response Time</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status Code</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Executed</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <Link
                      to={`/projects/${projectId}/endpoints/${run.endpoint_id}`}
                      style={{ color: '#1976d2', textDecoration: 'none' }}
                    >
                      Endpoint #{run.endpoint_id}
                    </Link>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
