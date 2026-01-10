import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { API_URL } from '../utils/helpers';

function EventDetailsPage() {
  const { user, logout } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Get event ID from URL
  const eventId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadEventDetails();
  }, []);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes do evento');
      }
      
      const responseData = await response.json();
      setEvent(responseData.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      showError('Erro ao carregar evento. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      showError('Todos os campos são obrigatórios');
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(`${API_URL}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao realizar inscrição');
      }

      showSuccess('Inscrição realizada com sucesso!');
      setFormData({ name: '', email: '', phone: '' });
      loadEventDetails(); // Refresh to update available slots
    } catch (error) {
      showError(error.message);
    }
    setRegistering(false);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Evento',
        url: url
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        showSuccess('Link copiado para a área de transferência!');
      });
    } else {
      navigator.clipboard.writeText(url);
      showSuccess('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} onLogout={logout} currentPage="" />
        <div className="container py-5">
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar user={user} onLogout={logout} currentPage="" />
        <div className="container py-5">
          <div className="alert alert-danger">Evento não encontrado</div>
        </div>
        <Footer />
      </>
    );
  }

  const eventDate = new Date(event.dateTime);
  const formattedDate = eventDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const slotsColor = event.availableSlots > 10 ? 'success' : event.availableSlots > 0 ? 'warning' : 'danger';
  const slotsText = event.availableSlots > 0 ? `${event.availableSlots} vagas disponíveis` : 'Esgotado';

  return (
    <>
      <Navbar user={user} onLogout={logout} currentPage="" />
      
      <section className="event-details-section py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h1 className="card-title mb-3">{event.title}</h1>
                  <div className="mb-3">
                    <span className="badge bg-primary me-2">
                      <i className="bi bi-calendar"></i> {formattedDate}
                    </span>
                    <span className={`badge bg-${slotsColor} me-2`}>
                      <i className="bi bi-people"></i> {slotsText}
                    </span>
                    {event.local && (
                      <span className="badge bg-secondary me-2">
                        <i className="bi bi-geo-alt"></i> {event.local}
                      </span>
                    )}
                    {event.eventCode && (
                      <span className="badge bg-info text-dark">
                        <i className="bi bi-tag-fill"></i> {event.eventCode}
                      </span>
                    )}
                  </div>
                  <p className="card-text">{event.description}</p>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                    <button className="btn btn-outline-primary" onClick={handleShare}>
                      <i className="bi bi-share"></i> Compartilhar Evento
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
                <div className="card-body">
                  <h5 className="card-title">Inscrição</h5>
                  {event.availableSlots > 0 ? (
                    <form onSubmit={handleRegister}>
                      <div className="mb-3">
                        <label className="form-label">Nome Completo *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">E-mail *</label>
                        <input 
                          type="email" 
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Telefone *</label>
                        <input 
                          type="tel" 
                          className="form-control"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={registering}
                      >
                        {registering ? 'Inscrevendo...' : 'Inscrever-se'}
                      </button>
                    </form>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle"></i> Evento esgotado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EventDetailsPage />);
