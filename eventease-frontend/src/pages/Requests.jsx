import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import Modal from '../components/Modal';
import RequestModal from '../components/RequestModal';
import EmptyState from '../components/EmptyState';
import { Api } from '../api/api';
import { coverFor } from '../data/images';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime, money } from '../utils/format';

const TABS = [['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']];

export default function Requests() {
  const toast = useToast();
  const nav = useNavigate();
  const { refresh, setCurrent } = useEvents();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(params.get('new') === '1');
  const [cancelling, setCancelling] = useState(null);

  const load = () => Api.myRequests().then(setList).catch(err => { toast(err.message, 'error'); setList([]); });
  useEffect(() => { load(); }, []); // eslint-disable-line

  const count = s => (list || []).filter(r => s === 'all' || r.status === s).length;
  const shown = useMemo(() => (list || []).filter(r => tab === 'all' || r.status === tab), [list, tab]);

  function closeForm() { setOpen(false); if (params.get('new')) setParams({}); }

  async function openEvent(r) {
    const evs = await refresh();
    if (evs.some(e => e._id === r.eventId)) setCurrent(r.eventId);
    nav('/dashboard');
  }
  async function confirmCancel() {
    try { await Api.cancelRequest(cancelling._id); toast('Request cancelled'); setCancelling(null); load(); }
    catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="toolbar">
        <div className="tabs">
          {TABS.map(([k, l]) => <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}<em>{count(k)}</em></button>)}
        </div>
        <span className="grow" />
        <button className="btn" onClick={() => setOpen(true)}>+ New request</button>
      </div>

      {list === null && <p className="muted">Loading...</p>}
      {list && list.length === 0 && <EmptyState title="No requests yet" text="Pick one of our ideas or send your own. Our admin team will review it and reply soon" to="/discover" label="Discover events" />}

      <div className="rows">
        {shown.map((r, i) => (
          <article className="row-card rise" style={{ '--i': i }} key={r._id}>
            <div className="row-img"><Img src={coverFor(r.type)} type={r.type} alt="" /></div>
            <div className="row-main">
              <div className="row-tags"><span className="pill-tag">{r.type}</span>{r.source === 'ai' && <span className="pill-tag ai">AI suggested</span>}</div>
              <h3>{r.name}</h3>
              <p className="row-desc">{r.venue} · {r.guests} guests</p>
              {r.adminNote && <p className={'note ' + r.status}><b>Our team:</b> {r.adminNote}</p>}
            </div>
            <div className="row-mid">
              <span>{fmtDate(r.date)} · {fmtTime(r.time)}</span>
              <small>Sent {fmtDate(String(r.createdAt).slice(0, 10))}</small>
            </div>
            <div className="row-end">
              <span className={'badge ' + r.status}>{r.status}</span>
              <div className="price-box"><strong>{money(r.budget)}</strong></div>
              {r.status === 'pending' && <button className="btn btn-ghost btn-sm" onClick={() => setCancelling(r)}>Cancel</button>}
              {r.status === 'approved' && <button className="btn btn-sm" onClick={() => openEvent(r)}>Open event</button>}
            </div>
          </article>
        ))}
      </div>

      <RequestModal open={open} onClose={closeForm} onDone={load} />
      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title="Cancel this request?" narrow>
        <p>"{cancelling?.name}" will be withdrawn before our team reviews it.</p>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setCancelling(null)}>Keep it</button>
          <button className="btn btn-danger" onClick={confirmCancel}>Cancel request</button>
        </div>
      </Modal>
    </>
  );
}
