import React, { useState, useRef, useEffect } from 'react';

export default function LoginModal({ show, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  useEffect(() => {
    if (modalRef.current && window.bootstrap) {
      bsModalRef.current = new window.bootstrap.Modal(modalRef.current);
      
      modalRef.current.addEventListener('hidden.bs.modal', () => {
        setError('');
        setEmail('');
        setPassword('');
        onClose();
      });
    }
    
    return () => {
      if (bsModalRef.current) {
        bsModalRef.current.dispose();
      }
    };
  }, [onClose]);

  useEffect(() => {
    if (bsModalRef.current) {
      if (show) {
        bsModalRef.current.show();
      } else {
        bsModalRef.current.hide();
      }
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    const result = await onLogin(email, password);

    if (result.success) {
      if (bsModalRef.current) {
        bsModalRef.current.hide();
      }
      setEmail('');
      setPassword('');
      setError('');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div 
      ref={modalRef}
      className="modal fade" 
      id="loginModal" 
      tabIndex="-1"
      aria-labelledby="loginModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="loginModalLabel">Login</h5>
            <button 
              type="button" 
              className="btn-close" 
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <form id="loginForm" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="loginEmail" className="form-label">Email *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="loginEmail" 
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="loginPassword" className="form-label">Senha *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="loginPassword" 
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              data-bs-dismiss="modal"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span> Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
