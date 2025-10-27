import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './animations.css'
import TaskCoachApp from './TaskCoachApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TaskCoachApp />
  </StrictMode>,
)
