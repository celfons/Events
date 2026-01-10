import React, { useEffect } from 'react';

export default function Toast({ toasts, onRemove }) {
  const colorMap = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    info: 'bg-info text-white',
    warning: 'bg-warning text-dark'
  };

  const iconMap = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    info: 'bi-info-circle-fill',
    warning: 'bi-exclamation-triangle-fill'
  };

  const titleMap = {
    success: 'Sucesso',
    error: 'Erro',
    info: 'Informação',
    warning: 'Atenção'
  };

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          colorMap={colorMap}
          iconMap={iconMap}
          titleMap={titleMap}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, colorMap, iconMap, titleMap, onRemove }) {
  const toastRef = React.useRef(null);

  useEffect(() => {
    if (toastRef.current && window.bootstrap) {
      const bsToast = new window.bootstrap.Toast(toastRef.current);
      bsToast.show();
      
      const handleHidden = () => {
        onRemove(toast.id);
      };
      
      toastRef.current.addEventListener('hidden.bs.toast', handleHidden);
      
      return () => {
        if (toastRef.current) {
          toastRef.current.removeEventListener('hidden.bs.toast', handleHidden);
        }
      };
    }
  }, [toast.id, onRemove]);

  const bgClass = colorMap[toast.type] || colorMap.success;
  const iconClass = iconMap[toast.type] || iconMap.success;
  const titleText = titleMap[toast.type] || titleMap.success;

  return (
    <div 
      ref={toastRef}
      className="toast" 
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
    >
      <div className={`toast-header ${bgClass}`}>
        <i className={`bi ${iconClass} me-2`}></i>
        <strong className="me-auto">{titleText}</strong>
        <button 
          type="button" 
          className={`btn-close ${toast.type === 'warning' ? '' : 'btn-close-white'}`}
          data-bs-dismiss="toast" 
          aria-label="Close"
        ></button>
      </div>
      <div className={`toast-body ${bgClass}`}>
        {toast.message}
      </div>
    </div>
  );
}
