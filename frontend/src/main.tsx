import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'

// ─── Service Worker Registration ─────────────────────────────────────────────
// Register the font-caching service worker (sw.js) when the browser supports
// the Service Worker API. The SW implements a cache-first strategy for Google
// Fonts resources with a 30-day max lifetime (Requirements 11.5, 11.6).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        // Registration failure is non-fatal — fonts will still load from the
        // network; system fonts serve as fallback via font-display: swap.
        console.warn('[SW] Font cache service worker registration failed:', err)
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
