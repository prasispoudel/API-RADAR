import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi, anomaliesApi } from '../../services/api'
import type { Project, Anomaly } from '../../types/api'
import { Card, LoadingSpinner, ErrorMessage, Table, Select } from '../../components/ui'

export default function AnomaliesPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadAnomalies(selectedProject)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.list()
      setProjects(response.data)
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].id)
      }
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const loadAnomalies = async (projectId: number) => {
    try {
      const response = await anomaliesApi.listByProject(projectId)
      setAnomalies(response.data)
      setError(null)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Backend returns 404 when no anomalies exist; treat as empty list
        setAnomalies([])
        setError(null)
      } else {
        setError(err.message || 'Failed to load anomalies')
      }
    }
  }

  if (loading) return <LoadingSpinner />

  const highSeverity = anomalies.filter(a => a.severity === 'high').length
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length
  const lowSeverity = anomalies.filter(a => a.severity === 'low').length

  return (
    <div>
      <h2>Anomalies Dashboard</h2>

      {error && <ErrorMessage message={error} />}

      {projects.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No projects available. Create a project first.
          </p>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Select Project
            </label>
            <Select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <Card style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Anomalies</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{anomalies.length}</div>
            </Card>
            <Card style={{ padding: '1.5rem', background: '#ffebee' }}>
              <div style={{ fontSize: '0.875rem', color: '#c62828' }}>High Severity</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#c62828' }}>
                {highSeverity}
              </div>
            </Card>
            <Card style={{ padding: '1.5rem', background: '#fff3e0' }}>
              <div style={{ fontSize: '0.875rem', color: '#e65100' }}>Medium Severity</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#e65100' }}>
                {mediumSeverity}
              </div>
            </Card>
            <Card style={{ padding: '1.5rem', background: '#e8f5e9' }}>
              <div style={{ fontSize: '0.875rem', color: '#2e7d32' }}>Low Severity</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#2e7d32' }}>
                {lowSeverity}
              </div>
            </Card>
          </div>

          {anomalies.length === 0 ? (
            <Card>
              <p style={{ textAlign: 'center', color: '#666' }}>
                No anomalies detected for this project yet.
              </p>
            </Card>
          ) : (
            <Card>
              <Table>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Endpoint</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Severity</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Details</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((anomaly) => (
                    <tr key={anomaly.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <Link
                          to={`/projects/${selectedProject}/endpoints/${anomaly.endpoint_id}`}
                          style={{ color: '#1976d2', textDecoration: 'none' }}
                        >
                          Endpoint #{anomaly.endpoint_id}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{anomaly.anomaly_type}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
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
          )}
        </>
      )}
    </div>
  )
}
