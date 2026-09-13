import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { HostPage } from './pages/HostPage.jsx';
import { JoinPage } from './pages/JoinPage.jsx';
import { TransferPage } from './pages/TransferPage.jsx';

import './styles/global.css';
import './styles/components.css';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/host" element={<HostPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/transfer/:sessionId" element={<TransferPage />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
