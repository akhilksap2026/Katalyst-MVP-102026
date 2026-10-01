import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router as WouterRouter } from 'wouter'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </WouterRouter>
  </StrictMode>,
)
