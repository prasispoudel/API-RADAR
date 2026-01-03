import React from 'react'
import { createRoot } from 'react-dom/client'

function App(){
  return <div style={{padding:20}}>API Test Tool — Frontend placeholder</div>
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
