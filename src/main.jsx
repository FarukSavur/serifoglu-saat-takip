import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './registerServiceWorker'

createRoot(document.getElementById('root')).render(
  <App />
)

// Register service worker for PWA functionality
registerServiceWorker();
