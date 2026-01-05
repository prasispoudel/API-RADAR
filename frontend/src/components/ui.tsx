import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: '#1976d2',
      color: 'white',
    },
    secondary: {
      background: '#f5f5f5',
      color: '#333',
      border: '1px solid #ddd',
    },
    danger: {
      background: '#d32f2f',
      color: 'white',
    },
  }

  return (
    <button
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  )
}

export const Card: React.FC<{
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ children, style }) => (
  <div
    style={{
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      ...style,
    }}
  >
    {children}
  </div>
)

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  style,
  ...props
}) => (
  <input
    style={{
      padding: '0.5rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '0.875rem',
      width: '100%',
      ...style,
    }}
    {...props}
  />
)

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  style,
  children,
  ...props
}) => (
  <select
    style={{
      padding: '0.5rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '0.875rem',
      width: '100%',
      ...style,
    }}
    {...props}
  >
    {children}
  </select>
)

export const Table: React.FC<{
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ children, style }) => (
  <table
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      ...style,
    }}
  >
    {children}
  </table>
)

export const LoadingSpinner: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    <div
      style={{
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1976d2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      padding: '1rem',
      background: '#ffebee',
      border: '1px solid #f44336',
      borderRadius: '4px',
      color: '#c62828',
      margin: '1rem 0',
    }}
  >
    {message}
  </div>
)
