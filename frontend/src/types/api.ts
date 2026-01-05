// Type definitions matching backend schemas
export type AuthType = 'none' | 'api_key' | 'bearer' | 'custom'

export interface AuthConfig {
  type: AuthType
  header_name?: string
  header_value?: string
  token?: string
  headers?: Record<string, string>
}

export interface Project {
  id: number
  name: string
  base_url: string
  auth_config?: AuthConfig
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  base_url: string
  auth_config?: AuthConfig
}

export interface Endpoint {
  id: number
  project_id: number
  method: string
  path: string
  created_at: string
  updated_at: string
}

export interface EndpointCreate {
  project_id: number
  method: string
  path: string
}

export interface Scan {
  id: number
  project_id: number
  started_at: string
  completed_at?: string
  status: string
}

export interface ScanCreate {
  project_id: number
}

export interface TestRun {
  id: number
  endpoint_id: number
  scan_id?: number
  response_time: number
  status_code: number
  success: boolean
  error_message?: string
  executed_at: string
}

export interface Anomaly {
  id: number
  endpoint_id: number
  test_run_id: number
  anomaly_type: string
  severity: string
  details: string
  detected_at: string
}

export interface DiscoveryRequest {
  openapi_url?: string
  crawl?: boolean
  probe_common_paths?: boolean
}
