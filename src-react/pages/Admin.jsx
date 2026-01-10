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
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    totalSlots: '',
    local: ''
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    totalSlots: '',
    local: '',
    isActive: true
  });
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreateError('');

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...createFormData,
          totalSlots: parseInt(createFormData.totalSlots, 10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Erro ao criar evento');
        return;
      }

      showSuccess('Evento criado com sucesso!');
      setShowCreateModal(false);
      setCreateFormData({
        title: '',
        description: '',
        dateTime: '',
        totalSlots: '',
        local: ''
      });
      loadEvents(); // Reload the events list
    } catch (error) {
      console.error('Error creating event:', error);
      setCreateError('Erro ao criar evento. Tente novamente mais tarde.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const data = await response.json();
        showError(data.error || 'Erro ao excluir evento');
        return;
      }

      showSuccess('Evento excluído com sucesso!');
      loadEvents(); // Reload the events list
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Erro ao excluir evento. Tente novamente mais tarde.');
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    // Format datetime for datetime-local input
    const dateTime = new Date(event.dateTime);
    const formattedDateTime = dateTime.toISOString().slice(0, 16);
    
    setEditFormData({
      title: event.title,
      description: event.description,
      dateTime: formattedDateTime,
      totalSlots: event.totalSlots,
      local: event.local || '',
      isActive: event.isActive !== false
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setEditError('');

    try {
      const response = await fetch(`${API_URL}/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...editFormData,
          totalSlots: parseInt(editFormData.totalSlots, 10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error || 'Erro ao atualizar evento');
        return;
      }

      showSuccess('Evento atualizado com sucesso!');
      setShowEditModal(false);
      setSelectedEvent(null);
      setEditFormData({
        title: '',
        description: '',
        dateTime: '',
        totalSlots: '',
        local: '',
        isActive: true
      });
      loadEvents(); // Reload the events list
    } catch (error) {
      console.error('Error updating event:', error);
      setEditError('Erro ao atualizar evento. Tente novamente mais tarde.');
    }
  };

  const loadParticipants = async (eventId) => {
    try {
      setLoadingParticipants(true);
      const response = await fetch(`${API_URL}/api/events/${eventId}/participants`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar participantes');
      }

      const responseData = await response.json();
      setParticipants(responseData.data || []);
      setLoadingParticipants(false);
    } catch (error) {
      console.error('Error loading participants:', error);
      showError('Erro ao carregar participantes. Tente novamente mais tarde.');
      setLoadingParticipants(false);
    }
  };

  const openParticipantsModal = (event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
    loadParticipants(event.id);
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
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Criar Evento
            </button>
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
                    <th>Ações</th>
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
                        <td>
                          <div className="btn-group" role="group" aria-label="Event actions">
                            <button 
                              className="btn btn-sm btn-primary"
                              title="Editar"
                              onClick={() => openEditModal(event)}
                            >
                              <i className="bi bi-pencil"></i> Editar
                            </button>
                            <button 
                              className="btn btn-sm btn-info"
                              title="Ver Participantes"
                              onClick={() => openParticipantsModal(event)}
                            >
                              <i className="bi bi-people"></i> Participantes
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              title="Excluir"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
                                  handleDeleteEvent(event.id);
                                }
                              }}
                            >
                              <i className="bi bi-trash"></i> Excluir
                            </button>
                          </div>
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

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Criar Novo Evento</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      title: '',
                      description: '',
                      dateTime: '',
                      totalSlots: '',
                      local: ''
                    });
                    setCreateError('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateEvent}>
                  <div className="mb-3">
                    <label htmlFor="eventTitle" className="form-label">Título *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="eventTitle"
                      placeholder="Workshop de Node.js"
                      value={createFormData.title}
                      onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="eventDescription" className="form-label">Descrição *</label>
                    <textarea 
                      className="form-control" 
                      id="eventDescription"
                      rows="3"
                      placeholder="Aprenda os fundamentos do Node.js..."
                      value={createFormData.description}
                      onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="eventDateTime" className="form-label">Data e Horário *</label>
                    <input 
                      type="datetime-local" 
                      className="form-control" 
                      id="eventDateTime"
                      value={createFormData.dateTime}
                      onChange={(e) => setCreateFormData({...createFormData, dateTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="eventSlots" className="form-label">Número de Vagas *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="eventSlots"
                      min="1"
                      placeholder="50"
                      value={createFormData.totalSlots}
                      onChange={(e) => setCreateFormData({...createFormData, totalSlots: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="eventLocal" className="form-label">Local</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="eventLocal"
                      placeholder="Auditório Principal, Sala 301, etc."
                      value={createFormData.local}
                      onChange={(e) => setCreateFormData({...createFormData, local: e.target.value})}
                    />
                  </div>
                  {createError && (
                    <div className="alert alert-danger" role="alert">
                      {createError}
                    </div>
                  )}
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      title: '',
                      description: '',
                      dateTime: '',
                      totalSlots: '',
                      local: ''
                    });
                    setCreateError('');
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Criar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop fade show"></div>}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Evento</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    setEditFormData({
                      title: '',
                      description: '',
                      dateTime: '',
                      totalSlots: '',
                      local: '',
                      isActive: true
                    });
                    setEditError('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateEvent}>
                  <div className="mb-3">
                    <label htmlFor="editEventTitle" className="form-label">Título *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="editEventTitle"
                      placeholder="Workshop de Node.js"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editEventDescription" className="form-label">Descrição *</label>
                    <textarea 
                      className="form-control" 
                      id="editEventDescription"
                      rows="3"
                      placeholder="Aprenda os fundamentos do Node.js..."
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editEventDateTime" className="form-label">Data e Horário *</label>
                    <input 
                      type="datetime-local" 
                      className="form-control" 
                      id="editEventDateTime"
                      value={editFormData.dateTime}
                      onChange={(e) => setEditFormData({...editFormData, dateTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editEventSlots" className="form-label">Número de Vagas *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="editEventSlots"
                      min="1"
                      placeholder="50"
                      value={editFormData.totalSlots}
                      onChange={(e) => setEditFormData({...editFormData, totalSlots: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editEventLocal" className="form-label">Local</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="editEventLocal"
                      placeholder="Auditório Principal, Sala 301, etc."
                      value={editFormData.local}
                      onChange={(e) => setEditFormData({...editFormData, local: e.target.value})}
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="editEventIsActive"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="editEventIsActive">
                      Ativo
                    </label>
                  </div>
                  {editError && (
                    <div className="alert alert-danger" role="alert">
                      {editError}
                    </div>
                  )}
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    setEditFormData({
                      title: '',
                      description: '',
                      dateTime: '',
                      totalSlots: '',
                      local: '',
                      isActive: true
                    });
                    setEditError('');
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditModal && <div className="modal-backdrop fade show"></div>}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Participantes - {selectedEvent?.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowParticipantsModal(false);
                    setSelectedEvent(null);
                    setParticipants([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {loadingParticipants && (
                  <div className="text-center my-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Carregando...</span>
                    </div>
                  </div>
                )}

                {!loadingParticipants && participants.length === 0 && (
                  <div className="alert alert-info text-center" role="alert">
                    <i className="bi bi-info-circle"></i> Nenhum participante confirmado ainda.
                  </div>
                )}

                {!loadingParticipants && participants.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Nome</th>
                          <th>Email</th>
                          <th>Telefone</th>
                          <th>Data de Inscrição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((participant, index) => (
                          <tr key={participant.id || index}>
                            <td>{participant.name}</td>
                            <td>{participant.email}</td>
                            <td>{participant.phone}</td>
                            <td>
                              {new Date(participant.registeredAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3">
                      <strong>Total de participantes confirmados: {participants.length}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowParticipantsModal(false);
                    setSelectedEvent(null);
                    setParticipants([]);
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showParticipantsModal && <div className="modal-backdrop fade show"></div>}
    </>
  );
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminPage />);
