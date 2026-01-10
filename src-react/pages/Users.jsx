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
  const { toasts, showError, removeToast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
                        <a 
                          href={`/users/${user.id}`}
                          className="btn btn-sm btn-outline-primary"
                          title="Ver Detalhes"
                        >
                          <i className="bi bi-eye"></i>
                        </a>
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
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UsersPage />);
