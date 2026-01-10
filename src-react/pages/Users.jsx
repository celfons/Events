import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { API_URL } from '../utils/helpers';
import { getToken, isSuperuser } from '../utils/auth';

function UsersPage() {
  const { user, logout } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');

  // Redirect if not superuser
  useEffect(() => {
    if (user && !isSuperuser()) {
      showError('Acesso negado. Apenas superusuários podem acessar esta página.');
      window.location.href = '/';
    }
  }, [user]);

  useEffect(() => {
    if (user && isSuperuser()) {
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/?login=required';
          return;
        }
        throw new Error('Erro ao carregar usuários');
      }
      
      const responseData = await response.json();
      setUsers(responseData.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Erro ao carregar usuários. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      ));
    } else {
      setFilteredUsers(users);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Erro ao criar usuário');
        return;
      }

      showSuccess('Usuário criado com sucesso!');
      setShowCreateModal(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      loadUsers(); // Reload the users list
    } catch (error) {
      console.error('Error creating user:', error);
      setCreateError('Erro ao criar usuário. Tente novamente mais tarde.');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');

    try {
      const updateData = {
        username: editFormData.username,
        email: editFormData.email,
        role: editFormData.role
      };

      // Only include password if it was provided
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error || 'Erro ao atualizar usuário');
        return;
      }

      showSuccess('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      loadUsers(); // Reload the users list
    } catch (error) {
      console.error('Error updating user:', error);
      setEditError('Erro ao atualizar usuário. Tente novamente mais tarde.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const data = await response.json();
        showError(data.error || 'Erro ao excluir usuário');
        return;
      }

      showSuccess('Usuário excluído com sucesso!');
      loadUsers(); // Reload the users list
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Erro ao excluir usuário. Tente novamente mais tarde.');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setEditError('');
    setShowEditModal(true);
  };

  if (!user || !isSuperuser()) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={logout}
        currentPage="users"
      />
      
      <section className="users-section py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gerenciar Usuários</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Criar Usuário
            </button>
          </div>

          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Buscar usuários por nome ou email..."
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
          </div>

          {loading && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle"></i> Nenhum usuário encontrado.
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Email</th>
                    <th>Nome de Usuário</th>
                    <th>Papel</th>
                    <th>Data de Criação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.username}</td>
                      <td>
                        <span className={`badge bg-${user.role === 'superuser' ? 'danger' : 'primary'}`}>
                          {user.role === 'superuser' ? 'Superusuário' : 'Usuário'}
                        </span>
                      </td>
                      <td>
                        {new Date(user.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="btn-group" role="group" aria-label="User actions">
                          <button 
                            className="btn btn-sm btn-primary"
                            title="Editar"
                            onClick={() => openEditModal(user)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            title="Excluir"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Criar Novo Usuário</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      username: '',
                      email: '',
                      password: '',
                      role: 'user'
                    });
                    setCreateError('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateUser}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Nome de Usuário *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="username"
                      value={createFormData.username}
                      onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Senha *</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                      minLength="6"
                      required
                    />
                    <small className="form-text text-muted">Mínimo de 6 caracteres</small>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Papel</label>
                    <select 
                      className="form-select" 
                      id="role"
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                    >
                      <option value="user">Usuário</option>
                      <option value="superuser">Superusuário</option>
                    </select>
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
                      username: '',
                      email: '',
                      password: '',
                      role: 'user'
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
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop fade show"></div>}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Usuário</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setEditFormData({
                      username: '',
                      email: '',
                      password: '',
                      role: 'user'
                    });
                    setEditError('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditUser}>
                  <div className="mb-3">
                    <label htmlFor="editUsername" className="form-label">Nome de Usuário *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="editUsername"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editEmail" className="form-label">Email *</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="editEmail"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editPassword" className="form-label">Nova Senha (opcional)</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="editPassword"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                      placeholder="Deixe em branco para não alterar"
                    />
                    <small className="form-text text-muted">Mínimo de 6 caracteres se desejar alterar</small>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editRole" className="form-label">Papel *</label>
                    <select 
                      className="form-control" 
                      id="editRole"
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                      required
                    >
                      <option value="user">Usuário</option>
                      <option value="superuser">Superusuário</option>
                    </select>
                  </div>
                  {editError && (
                    <div className="alert alert-danger" role="alert">
                      {editError}
                    </div>
                  )}
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                        setEditFormData({
                          username: '',
                          email: '',
                          password: '',
                          role: 'user'
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
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditModal && <div className="modal-backdrop fade show"></div>}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UsersPage />);
