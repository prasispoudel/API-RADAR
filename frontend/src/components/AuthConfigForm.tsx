import React, { useState } from 'react'
import type { AuthConfig, AuthType } from '../types/api'
import { Input, Select, Card } from './ui'

interface AuthConfigFormProps {
  value: AuthConfig
  onChange: (config: AuthConfig) => void
}

export const AuthConfigForm: React.FC<AuthConfigFormProps> = ({ value, onChange }) => {
  const [authType, setAuthType] = useState<AuthType>(value.type || 'none')
  const [headerName, setHeaderName] = useState(value.header_name || 'X-API-Key')
  const [headerValue, setHeaderValue] = useState(value.header_value || '')
  const [token, setToken] = useState(value.token || '')
  const [customHeaders, setCustomHeaders] = useState(
    value.headers ? JSON.stringify(value.headers, null, 2) : ''
  )

  const handleAuthTypeChange = (newType: AuthType) => {
    setAuthType(newType)
    
    // Build the auth config based on type
    let config: AuthConfig = { type: newType }
    
    switch (newType) {
      case 'api_key':
        config = {
          type: 'api_key',
          header_name: headerName,
          header_value: headerValue,
        }
        break
      case 'bearer':
        config = {
          type: 'bearer',
          token: token,
        }
        break
      case 'custom':
        try {
          config = {
            type: 'custom',
            headers: customHeaders ? JSON.parse(customHeaders) : {},
          }
        } catch {
          // Invalid JSON, don't update
          return
        }
        break
      case 'none':
      default:
        config = { type: 'none' }
        break
    }
    
    onChange(config)
  }

  const handleApiKeyChange = (name: string, val: string) => {
    const newHeaderName = name !== undefined ? name : headerName
    const newHeaderValue = val !== undefined ? val : headerValue
    
    if (name !== undefined) setHeaderName(name)
    if (val !== undefined) setHeaderValue(val)
    
    onChange({
      type: 'api_key',
      header_name: newHeaderName,
      header_value: newHeaderValue,
    })
  }

  const handleBearerChange = (newToken: string) => {
    setToken(newToken)
    onChange({
      type: 'bearer',
      token: newToken,
    })
  }

  const handleCustomHeadersChange = (jsonString: string) => {
    setCustomHeaders(jsonString)
    try {
      const headers = JSON.parse(jsonString)
      onChange({
        type: 'custom',
        headers: headers,
      })
    } catch {
      // Invalid JSON, don't update parent
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        Authentication Type
      </label>
      <Select
        value={authType}
        onChange={(e) => handleAuthTypeChange(e.target.value as AuthType)}
      >
        <option value="none">None</option>
        <option value="api_key">API Key Header</option>
        <option value="bearer">Bearer Token</option>
        <option value="custom">Custom Headers</option>
      </Select>

      {authType === 'api_key' && (
        <Card style={{ marginTop: '1rem', background: '#f9f9f9' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Header Name
            </label>
            <Input
              value={headerName}
              onChange={(e) => handleApiKeyChange(e.target.value, headerValue)}
              placeholder="X-API-Key"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Header Value
            </label>
            <Input
              type="password"
              value={headerValue}
              onChange={(e) => handleApiKeyChange(headerName, e.target.value)}
              placeholder="your-api-key-here"
            />
          </div>
        </Card>
      )}

      {authType === 'bearer' && (
        <Card style={{ marginTop: '1rem', background: '#f9f9f9' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Bearer Token
          </label>
          <Input
            type="password"
            value={token}
            onChange={(e) => handleBearerChange(e.target.value)}
            placeholder="your-bearer-token-here"
          />
        </Card>
      )}

      {authType === 'custom' && (
        <Card style={{ marginTop: '1rem', background: '#f9f9f9' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Custom Headers (JSON)
          </label>
          <textarea
            value={customHeaders}
            onChange={(e) => handleCustomHeadersChange(e.target.value)}
            placeholder={`{\n  "Authorization": "Custom xyz123",\n  "X-Custom-Header": "value"\n}`}
            rows={6}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', marginBottom: 0 }}>
            Enter valid JSON with header key-value pairs
          </p>
        </Card>
      )}
    </div>
  )
}
