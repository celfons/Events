import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { API_URL } from '../utils/helpers';
import { getToken } from '../utils/auth';

function AdminPage() {
  const { user, logout } = useAuth();
  const { toasts, showError, removeToast } = useToast();
  
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const eventsPerPage = 10;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      window.location.href = '/?login=required';
    }
  }, [user]);

  // Load events on mount
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  // Filter events when search or filter changes
  useEffect(() => {
    filterEvents();
  }, [searchQuery, activeOnly, events]);

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events/my-events`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/?login=required';
          return;
        }
        throw new Error('Erro ao carregar eventos');
      }
      
      const responseData = await response.json();
      const eventsData = responseData.data || [];
      
      setEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      showError('Erro ao carregar eventos. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;
    
    // Apply status filter
    if (activeOnly) {
      filtered = filtered.filter(event => event.isActive !== false);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredEvents(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const startIndex = (currentPage - 1) * eventsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={logout}
        currentPage="admin"
      />
      
      <section className="admin-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gerenciar Eventos</h2>
          </div>

          {/* Search and Filters */}
          <div className="mb-4">
            <div className="input-group mb-2">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Buscar eventos por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setSearchQuery('')}
              >
                <i className="bi bi-x"></i> Limpar
              </button>
            </div>
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="activeOnlySwitch"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="activeOnlySwitch">
                <i className="bi bi-funnel"></i> Mostrar apenas eventos ativos
              </label>
            </div>
          </div>

          {loading && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle"></i> Nenhum evento cadastrado.
            </div>
          )}

          {!loading && currentEvents.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Data e Horário</th>
                    <th>Vagas Disponíveis</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents.map(event => {
                    const eventDate = new Date(event.dateTime);
                    const formattedDate = eventDate.toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    const isActive = event.isActive !== false;

                    return (
                      <tr key={event.id}>
                        <td>{event.eventCode || 'N/A'}</td>
                        <td>{event.title}</td>
                        <td>{formattedDate}</td>
                        <td>{event.availableSlots}</td>
                        <td>
                          <span className={`badge bg-${isActive ? 'success' : 'secondary'}`}>
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminPage />);
