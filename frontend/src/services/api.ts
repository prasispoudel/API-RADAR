import axios from 'axios'
import type {
  Project,
  ProjectCreate,
  Endpoint,
  EndpointCreate,
  Scan,
  ScanCreate,
  TestRun,
  Anomaly,
  DiscoveryRequest,
} from '../types/api'

// Use proxy in dev; allow override (e.g., VITE_API_BASE=http://localhost:8000) for preview/prod
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Projects
export const projectsApi = {
  list: () => api.get<Project[]>('projects'),
  get: (id: number) => api.get<Project>(`projects/${id}`),
  create: (data: ProjectCreate) => api.post<Project>('projects', data),
  discover: (id: number, data: DiscoveryRequest) =>
    api.post(`projects/${id}/discover`, data),
}

// Endpoints
export const endpointsApi = {
  list: (projectId: number) =>
    api.get<Endpoint[]>(`projects/${projectId}/endpoints`),
  get: (id: number) => api.get<Endpoint>(`endpoints/${id}`),
  create: (data: EndpointCreate) => api.post<Endpoint>(`projects/${data.project_id}/endpoints`, data),
  listRuns: (id: number) => api.get<TestRun[]>(`endpoints/${id}/runs`),
}

// Scans
export const scansApi = {
  list: (projectId: number) =>
    api.get<Scan[]>(`projects/${projectId}/scans`),
  get: (id: number) => api.get<Scan>(`scans/${id}`),
  create: (data: ScanCreate) => api.post<Scan>(`projects/${data.project_id}/scans`, data),
  getRuns: (id: number) => api.get<TestRun[]>(`scans/${id}/runs`),
}

// Anomalies
export const anomaliesApi = {
  listByProject: (projectId: number) =>
    api.get<Anomaly[]>(`projects/${projectId}/anomalies`),
  listByEndpoint: (endpointId: number) =>
    api.get<Anomaly[]>(`endpoints/${endpointId}/anomalies`),
  computeForEndpoint: (endpointId: number) =>
    api.post(`anomalies/compute/${endpointId}`),
}

export default api
