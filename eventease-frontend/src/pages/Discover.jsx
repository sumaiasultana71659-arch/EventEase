import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon';
import RequestModal from '../components/RequestModal';
import SuggestionCard, { toRequest } from '../components/SuggestionCard';
import { Api } from '../api/api';
import { EVENT_TYPES } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const VIBES = ['Elegant', 'Fun & colourful', 'Minimal', 'Outdoor', 'Luxury'];
const num = v => (v === '' || v === null || v === undefined ? '' : Number(v));

export default function Discover() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const p = user.preferences || {};
  const [form, setForm] = useState({
    budgetMin: p.budgetMin ?? '', budgetMax: p.budgetMax ?? '', guests: p.guests ?? '',
    types: p.types || [], city: p.city || '', vibe: p.vibe || ''
  });
  const [list, setList] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [req, setReq] = useState(null);   // null = closed, {} = blank form, {...} = prefilled

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });
  const toggle = t => setForm(f => ({ ...f, types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t] }));

  const load = useCallback(async () => {
    setBusy(true);
    try { const r = await Api.ai.suggestions(); setList(r.suggestions); setNote(r.note || ''); }
    catch (err) { toast(err.message, 'error'); setList([]); }
    finally { setBusy(false); }
  }, [toast]);

  // first visit: suggestions from the saved preferences
  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault();
    const prefs = { budgetMin: num(form.budgetMin), budgetMax: num(form.budgetMax), guests: num(form.guests), types: form.types, city: form.city, vibe: form.vibe };
    if (prefs.budgetMin !== '' && prefs.budgetMax !== '' && prefs.budgetMin > prefs.budgetMax) return toast('Minimum budget is higher than the maximum', 'error');
    setBusy(true);
    try { await updateProfile({ preferences: prefs }); toast('Preferences saved'); await load(); }
    catch (err) { toast(err.message, 'error'); setBusy(false); }
  }

  return (
    <>
      <section className="grid discover">
        <form className="card pref-card rise" onSubmit={save} noValidate>
          <div className="card-head"><h2>Your preferences</h2><span className="ai-badge"><Icon name="ai" />Used for ideas</span></div>
          <p className="hint" style={{ marginBottom: 14 }}>Tell us your budget and taste. We suggest events that realistically fit, and you can request one with a click.</p>
          <div className="field-row">
            <div className="field"><label htmlFor="p-min">Budget from</label><input id="p-min" name="budgetMin" type="number" min="0" placeholder="e.g. 3000" value={form.budgetMin} onChange={set} /></div>
            <div className="field"><label htmlFor="p-max">Budget up to</label><input id="p-max" name="budgetMax" type="number" min="0" placeholder="e.g. 9000" value={form.budgetMax} onChange={set} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label htmlFor="p-guests">Typical guests</label><input id="p-guests" name="guests" type="number" min="1" placeholder="e.g. 80" value={form.guests} onChange={set} /></div>
            <div className="field"><label htmlFor="p-city">City / area</label><input id="p-city" name="city" placeholder="e.g. Chattogram" value={form.city} onChange={set} /></div>
          </div>
          <div className="field"><label>Events you like</label>
            <div className="chips">
              {EVENT_TYPES.filter(t => t !== 'Other').map(t => (
                <button type="button" key={t} className={'chip' + (form.types.includes(t) ? ' on' : '')} onClick={() => toggle(t)} aria-pressed={form.types.includes(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>Style</label>
            <div className="chips">
              {VIBES.map(v => (
                <button type="button" key={v} className={'chip' + (form.vibe === v ? ' on' : '')} onClick={() => setForm(f => ({ ...f, vibe: f.vibe === v ? '' : v }))} aria-pressed={form.vibe === v}>{v}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-ai btn-block" type="submit" disabled={busy}>{busy ? 'Thinking...' : 'Save and see ideas'}</button>
        </form>

        <div className="card custom-card rise" style={{ '--i': 2 }}>
          <span className="feature-ico tone-pink"><Icon name="plus" /></span>
          <h2>Have your own idea?</h2>
          <p>Skip the ideas and tell us exactly what you want. Our team will confirm it, adjust it, or explain why not.</p>
          <button className="btn btn-ghost" onClick={() => setReq({})}>Request a custom event</button>
          <ol className="flow-mini">
            <li><b>1</b>You request</li><li><b>2</b>We confirm</li><li><b>3</b>You plan</li>
          </ol>
        </div>
      </section>

      <div className="card-head sec-head"><h2>Ideas for you</h2><small className="muted">Prices are estimates for planning. Final costs depend on the venue.</small></div>
      {list === null && <p className="muted">Finding ideas...</p>}
      {list && list.length === 0 && <p className="empty">{note || 'No ideas yet. Save your preferences above.'}</p>}
      <div className="grid sug-grid">
        {list && list.map((s, i) => <SuggestionCard key={s.title + i} s={s} i={i} onRequest={x => setReq(toRequest(x))} />)}
      </div>

      <RequestModal open={req !== null} initial={req || undefined} onClose={() => setReq(null)} />
    </>
  );
}
