import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../services/api'
import type { Project, ProjectCreate, AuthConfig } from '../../types/api'
import { Button, Card, Input, LoadingSpinner, ErrorMessage, Table } from '../../components/ui'
import { AuthConfigForm } from '../../components/AuthConfigForm'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    base_url: '',
    auth_config: { type: 'none' },
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.list()
      setProjects(response.data)
      setError(null)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Backend returns 404 when no projects exist; treat as empty list
        setProjects([])
        setError(null)
      } else {
        setError(err.message || 'Failed to load projects')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await projectsApi.create(formData)
      setFormData({ name: '', base_url: '', auth_config: { type: 'none' } })
      setShowForm(false)
      loadProjects()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Create New Project</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Project Name
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My API Project"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Base URL
              </label>
              <Input
                required
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
            <AuthConfigForm
              value={formData.auth_config || { type: 'none' }}
              onChange={(auth_config) => setFormData({ ...formData, auth_config })}
            />
            <Button type="submit">Create Project</Button>
          </form>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No projects created yet. Create your first project to get started.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Base URL</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <Link
                      to={`/projects/${project.id}`}
                      style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>{project.base_url}</td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="secondary" style={{ marginRight: '0.5rem' }}>
                        View
                      </Button>
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
