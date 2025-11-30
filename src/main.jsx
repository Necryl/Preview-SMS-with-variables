import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PromptProvider } from './Prompt.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PromptProvider>
      <App />
    </PromptProvider>
  </StrictMode>,
)
