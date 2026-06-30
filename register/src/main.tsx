import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationPage from './RegistrationPage';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/v/:token" element={<RegistrationPage />} />
        <Route path="*" element={<div style={{ padding: 48, textAlign: 'center' }}><h2>Invalid registration link</h2></div>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
