/**
 * @file main.tsx
 * @description Ponto de Montagem (Entry Point) principal do React (Vite).
 * Instancia a aplicação React na DOM do HTML (index.html).
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Importa o TailwindCSS e estilos globais
import App from './App.tsx'

// Renderiza a aplicação dentro da div id="root"
createRoot(document.getElementById('root')!).render(
  // StrictMode ajuda a detectar bugs no ciclo de vida (renderiza componentes duas vezes em dev)
  <StrictMode>
    <App />
  </StrictMode>,
)
