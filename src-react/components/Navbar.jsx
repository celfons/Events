import React from 'react';

export default function Navbar({ user, onLogout, showLogin, currentPage = 'events' }) {
  const isSuperuser = user && user.role === 'superuser';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="/">
          <i className="bi bi-calendar-event"></i> Plataforma de Eventos
        </a>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className={`nav-link ${currentPage === 'events' ? 'active' : ''}`} href="/">
                Eventos
              </a>
            </li>
            <li className="nav-item">
              <a className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`} href="/admin">
                Admin
              </a>
            </li>
            {isSuperuser && (
              <li className="nav-item">
                <a className={`nav-link ${currentPage === 'users' ? 'active' : ''}`} href="/users">
                  Usuários
                </a>
              </li>
            )}
            {!user ? (
              <li className="nav-item">
                <button 
                  className="btn btn-outline-light btn-sm" 
                  onClick={showLogin}
                >
                  <i className="bi bi-box-arrow-in-right"></i> Login
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <span className="nav-link">Olá, {user.username}</span>
                </li>
                <li className="nav-item">
                  <button 
                    className="btn btn-outline-light btn-sm" 
                    onClick={onLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i> Sair
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
