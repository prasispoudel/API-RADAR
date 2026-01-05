import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export const Layout: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#1976d2',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>API Test Tool</h1>
      </header>

      <nav style={{
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        padding: '0 2rem',
      }}>
        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          gap: '2rem',
        }}>
          <li>
            <Link
              to="/"
              style={{
                display: 'block',
                padding: '1rem 0',
                textDecoration: 'none',
                color: isActive('/') ? '#1976d2' : '#333',
                fontWeight: isActive('/') ? 'bold' : 'normal',
                borderBottom: isActive('/') ? '2px solid #1976d2' : 'none',
              }}
            >
              Projects
            </Link>
          </li>
          <li>
            <Link
              to="/anomalies"
              style={{
                display: 'block',
                padding: '1rem 0',
                textDecoration: 'none',
                color: isActive('/anomalies') ? '#1976d2' : '#333',
                fontWeight: isActive('/anomalies') ? 'bold' : 'normal',
                borderBottom: isActive('/anomalies') ? '2px solid #1976d2' : 'none',
              }}
            >
              Anomalies
            </Link>
          </li>
        </ul>
      </nav>

      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>

      <footer style={{
        background: '#f5f5f5',
        borderTop: '1px solid #ddd',
        padding: '1rem 2rem',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.875rem',
      }}>
        API Test Tool © 2026
      </footer>
    </div>
  )
}
