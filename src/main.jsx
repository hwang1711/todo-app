import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Weekly from './pages/Weekly.jsx'
import Board from './pages/Board.jsx'
import Backlog from './pages/Backlog.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/weekly" element={<Weekly />} />
        <Route path="/board" element={<Board />} />
        <Route path="/backlog" element={<Backlog />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
