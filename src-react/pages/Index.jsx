import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { API_URL } from '../utils/helpers';

function EventsPage() {
  const { user, login, logout } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  const [futureEvents, setFutureEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const eventsPerPage = 5;

  // Check if login is required from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'required') {
      setShowLoginModal(true);
      // Remove the query parameter from URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Load events on mount and when page becomes visible
  useEffect(() => {
    loadEvents();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadEvents();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filter events when search query changes
  useEffect(() => {
    filterEvents();
  }, [searchQuery, futureEvents]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar eventos');
      }
      
      const responseData = await response.json();
      const eventsData = responseData.data || [];

      if (!Array.isArray(eventsData)) {
        setFutureEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        return;
      }
      
      // Filter events from today onwards
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const future = eventsData.filter(event => new Date(event.dateTime) >= startOfToday);
      
      setFutureEvents(future);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      showError('Erro ao carregar eventos. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const filterEvents = () => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(futureEvents);
    } else {
      const searchLower = searchQuery.toLowerCase();
      const searchUpper = searchQuery.toUpperCase();
      
      const filtered = futureEvents.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        (event.eventCode && event.eventCode.includes(searchUpper))
      );
      
      setFilteredEvents(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    
    if (result.success) {
      showSuccess('Login realizado com sucesso!');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    }
    
    return result;
  };

  const handleLogout = () => {
    logout();
    showSuccess('Logout realizado com sucesso!');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={handleLogout}
        showLogin={() => setShowLoginModal(true)}
        currentPage="events"
      />
      
      <section className="events-section py-5">
        <div className="container">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Buscar eventos por nome ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={clearSearch}
              >
                <i className="bi bi-x"></i> Limpar
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          )}

          {/* Events Grid */}
          {!loading && currentEvents.length > 0 && (
            <div className="row g-4">
              {currentEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* No Events Message */}
          {!loading && filteredEvents.length === 0 && (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle"></i> Nenhum evento disponível no momento.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Event pagination" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <a 
                    className="page-link" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    aria-label="Previous"
                  >
                    <span aria-hidden="true">&laquo;</span>
                  </a>
                </li>
                
                {[...Array(totalPages)].map((_, i) => (
                  <li 
                    key={i + 1} 
                    className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    <a 
                      className="page-link" 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(i + 1);
                      }}
                    >
                      {i + 1}
                    </a>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <a 
                    className="page-link" 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    aria-label="Next"
                  >
                    <span aria-hidden="true">&raquo;</span>
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </section>

      <Footer />
      
      <LoginModal 
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
      
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function EventCard({ event }) {
  const eventDate = new Date(event.dateTime);
  const formattedDate = eventDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const slotsColor = event.availableSlots > 10 ? 'success' : event.availableSlots > 0 ? 'warning' : 'danger';
  const slotsText = event.availableSlots > 0 
    ? `${event.availableSlots} vagas disponíveis` 
    : 'Esgotado';

  return (
    <div className="col-md-6 col-lg-4 fade-in">
      <div className="card event-card h-100">
        <div className="card-body">
          <h5 className="card-title">{event.title}</h5>
          <p className="card-text text-muted">{event.description}</p>
          <div className="mb-3">
            <span className="badge bg-primary">
              <i className="bi bi-calendar"></i> {formattedDate}
            </span>
            <span className={`badge bg-${slotsColor}`}>
              <i className="bi bi-people"></i> {slotsText}
            </span>
            {event.local && (
              <span className="badge bg-secondary">
                <i className="bi bi-geo-alt"></i> {event.local}
              </span>
            )}
            {event.eventCode && (
              <span className="badge bg-info text-dark">
                <i className="bi bi-tag-fill"></i> {event.eventCode}
              </span>
            )}
          </div>
          <a href={`/event/${event.id}`} className="btn btn-primary w-100">
            Ver Detalhes
          </a>
        </div>
      </div>
    </div>
  );
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EventsPage />);
