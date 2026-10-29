import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import Img from '../components/Img';
import Modal from '../components/Modal';
import { Api } from '../api/api';
import { coverFor } from '../data/images';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime, money } from '../utils/format';

const TABS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];

export default function AdminRequests() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [edit, setEdit] = useState({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Api.admin.requests().then(setList).catch(err => { toast(err.message, 'error'); setList([]); });
  useEffect(() => { load(); }, []); // eslint-disable-line

  // /admin/requests?open=<id> (from the dashboard) opens that request straight away
  useEffect(() => {
    const id = params.get('open');
    if (!id || !list) return;
    const r = list.find(x => x._id === id);
    if (r) { setTab(r.status); review(r); }
    setParams({}, { replace: true });
  }, [list]); // eslint-disable-line

  const count = s => (list || []).filter(r => s === 'all' || r.status === s).length;
  const shown = useMemo(() => (list || []).filter(r =>
    (tab === 'all' || r.status === tab) && (r.name + r.user?.name + r.user?.email + r.venue).toLowerCase().includes(q.toLowerCase())), [list, tab, q]);

  function review(r) {
    setSel(r); setNote(r.adminNote || ''); setError('');
    setEdit({ budget: r.budget, venue: r.venue, date: r.date, time: r.time });
  }
  const close = () => { setSel(null); setBusy(false); };
  const pending = sel?.status === 'pending';

  async function decide(kind) {
    setError('');
    if (kind === 'reject' && !note.trim()) return setError('Please write a short reason so the user knows why.');
    setBusy(true);
    try {
      if (kind === 'approve') {
        await Api.admin.approve(sel._id, { budget: Number(edit.budget), venue: edit.venue, date: edit.date, time: edit.time, note: note.trim() || undefined });
        toast('Approved. The event now exists in the user\'s dashboard.');
      } else { await Api.admin.reject(sel._id, note.trim()); toast('Request rejected'); }
      close(); load();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <>
      <div className="toolbar">
        <div className="tabs">
          {TABS.map(([k, l]) => <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}<em>{count(k)}</em></button>)}
        </div>
        <div className="search-box grow"><Icon name="search" /><input type="search" placeholder="Search event, user, email or venue" aria-label="Search requests" value={q} onChange={e => setQ(e.target.value)} /></div>
      </div>

      {list === null && <p className="muted">Loading...</p>}
      {list && shown.length === 0 && <p className="empty">Nothing here{tab === 'pending' ? '. All requests are reviewed.' : '.'}</p>}

      <div className="rows">
        {shown.map((r, i) => (
          <article className="row-card rise" style={{ '--i': i }} key={r._id}>
            <div className="row-img"><Img src={coverFor(r.type)} type={r.type} alt="" /></div>
            <div className="row-main">
              <div className="row-tags"><span className="pill-tag">{r.type}</span>{r.source === 'ai' && <span className="pill-tag ai">AI suggested</span>}</div>
              <h3>{r.name}</h3>
              <p className="row-desc"><span className="avatar sm">{r.user?.name?.charAt(0)}</span>{r.user?.name} · {r.user?.email}</p>
            </div>
            <div className="row-mid">
              <span><Icon name="pin" />{r.venue}</span>
              <span><Icon name="events" />{fmtDate(r.date)} · {fmtTime(r.time)}</span>
              <span><Icon name="guests" />{r.guests} guests</span>
            </div>
            <div className="row-end">
              <span className={'badge ' + r.status}>{r.status}</span>
              <div className="price-box"><strong>{money(r.budget)}</strong></div>
              <button className={'btn btn-sm' + (r.status === 'pending' ? '' : ' btn-ghost')} onClick={() => review(r)}>{r.status === 'pending' ? 'Review' : 'View'}</button>
            </div>
          </article>
        ))}
      </div>

      <Modal open={!!sel} onClose={close} title={pending ? 'Review request' : 'Request details'}>
        {sel && (
          <>
            <div className="review-head">
              <div className="mini-img big"><Img src={coverFor(sel.type)} type={sel.type} alt="" /></div>
              <div><strong>{sel.name}</strong><small>{sel.type} · by {sel.user?.name} ({sel.user?.email})</small>
                <small>{sel.guests} guests · {sel.source === 'ai' ? 'AI suggested' : 'custom idea'}</small></div>
            </div>
            {sel.description && <p className="note info">{sel.description}</p>}
            <div className="field-row">
              <div className="field"><label htmlFor="r-budget">Approved budget</label><input id="r-budget" type="number" min="0" disabled={!pending} value={edit.budget} onChange={e => setEdit({ ...edit, budget: e.target.value })} /></div>
              <div className="field"><label htmlFor="r-venue">Venue</label><input id="r-venue" disabled={!pending} value={edit.venue} onChange={e => setEdit({ ...edit, venue: e.target.value })} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label htmlFor="r-date">Date</label><input id="r-date" type="date" disabled={!pending} value={edit.date} onChange={e => setEdit({ ...edit, date: e.target.value })} /></div>
              <div className="field"><label htmlFor="r-time">Time</label><input id="r-time" type="time" disabled={!pending} value={edit.time} onChange={e => setEdit({ ...edit, time: e.target.value })} /></div>
            </div>
            <div className="field"><label htmlFor="r-note">Note to the user {pending && <span className="hint">(required when rejecting)</span>}</label>
              <textarea id="r-note" rows="3" disabled={!pending} value={note} onChange={e => setNote(e.target.value)} placeholder={pending ? 'e.g. Approved with a smaller budget, or: venue is not available on that date' : ''} /></div>
            <p className="error-text" role="alert">{error}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={close}>Close</button>
              {pending && <>
                <button className="btn btn-danger" disabled={busy} onClick={() => decide('reject')}>Reject</button>
                <button className="btn" disabled={busy} onClick={() => decide('approve')}>{busy ? 'Working...' : 'Approve'}</button>
              </>}
            </div>
            {pending && <p className="hint" style={{ marginTop: 10 }}>Approving creates the event for the user with an AI budget split, a starter task list and a schedule.</p>}
          </>
        )}
      </Modal>
    </>
  );
}
