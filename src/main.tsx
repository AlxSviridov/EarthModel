import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyUrlState } from './store/applyUrlState'
import './styles/main.css'

// Before the first render, so a shared link wins over saved local preferences and the
// learner never sees a flash of somebody else's last session.
applyUrlState(window.location.search)

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
