import { useEffect, useState } from 'react';
import Modal from './Modal';
import { Api } from '../api/api';
import { EVENT_TYPES } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const blank = { name: '', type: EVENT_TYPES[0], guests: '', date: '', time: '18:00', venue: '', budget: '', description: '', source: 'custom' };

// "Ask the admin for an event". Used by Discover (prefilled from an AI suggestion), My requests and the dashboard.
export default function RequestModal({ open, onClose, initial, onDone }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setError(''); setBusy(false);
      setForm({ ...blank, guests: user?.preferences?.guests || '', ...(initial || {}) });
    }
  }, [open, initial, user]);

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setError('');
    const data = { ...form, guests: Number(form.guests), budget: Number(form.budget) };
    if (!data.name.trim() || !data.venue.trim() || !data.date) return setError('Name, venue and date are required');
    if (!(data.guests >= 1) || !(data.budget >= 0)) return setError('Guests and budget must be valid numbers');
    setBusy(true);
    try {
      await Api.createRequest(data);
      toast('Request sent. Our team will get back to you.');
      onClose(); onDone && onDone();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={form.source === 'ai' ? 'Request this AI-suggested event' : 'Request an event'}>
      <p className="hint" style={{ marginBottom: 14 }}>Our team reviews every request, usually within a day. Once confirmed, the event appears in your dashboard with a starter budget, checklist and schedule.</p>
      <form onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="rq-name">Event name</label><input id="rq-name" name="name" value={form.name} onChange={set} required /></div>
        <div className="field-row">
          <div className="field"><label htmlFor="rq-type">Event type</label>
            <select id="rq-type" name="type" value={form.type} onChange={set}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="field"><label htmlFor="rq-guests">Expected guests</label><input id="rq-guests" name="guests" type="number" min="1" value={form.guests} onChange={set} required /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="rq-date">Date</label><input id="rq-date" name="date" type="date" value={form.date} onChange={set} required /></div>
          <div className="field"><label htmlFor="rq-time">Time</label><input id="rq-time" name="time" type="time" value={form.time} onChange={set} required /></div>
        </div>
        <div className="field"><label htmlFor="rq-venue">Preferred venue / area</label><input id="rq-venue" name="venue" value={form.venue} onChange={set} required /></div>
        <div className="field"><label htmlFor="rq-budget">Your budget</label><input id="rq-budget" name="budget" type="number" min="0" value={form.budget} onChange={set} required /></div>
        <div className="field"><label htmlFor="rq-desc">Anything our team should know</label><textarea id="rq-desc" name="description" rows="3" value={form.description} onChange={set} /></div>
        <p className="error-text" role="alert">{error}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button>
        </div>
      </form>
    </Modal>
  );
}
