import React from 'react'
import ReactDOM from 'react-dom/client'

import './assets/style/main.scss'
import "@rainbow-me/rainbowkit/styles.css"
import App from './App'
import './i18n'

declare global {
  interface Window {
    Ethereum: any;
    particlesJS: any;
    Telegram: any;
    onTelegramAuth: any;
  }
}

// Suppress known antd internal findDOMNode deprecation warning (antd DomWrapper class component)
if (import.meta.env.DEV) {
  const _consoleError = console.error.bind(console)
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) return
    _consoleError(...args)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
)