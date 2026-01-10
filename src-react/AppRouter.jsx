import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load page components
const IndexPage = lazy(() => import('./IndexContent'));
const AdminPage = lazy(() => import('./AdminContent'));
const EventDetailsPage = lazy(() => import('./EventDetailsContent'));
const UsersPage = lazy(() => import('./UsersContent'));

// Loading fallback
const LoadingFallback = () => (
  <div className="container py-5">
    <div className="text-center my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Carregando...</span>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/event/:id" element={<EventDetailsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
