import { useEffect } from 'react';

// Simple modal. Closes on Escape or when the dark background is clicked.
export default function Modal({ open, onClose, title, children, narrow = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal open" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={title} style={narrow ? { maxWidth: 420 } : undefined}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
