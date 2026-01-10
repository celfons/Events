import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

// Lazy load the main page component
const IndexPage = lazy(() => import('./Index'));

function App() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    }>
      <IndexPage />
    </Suspense>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
