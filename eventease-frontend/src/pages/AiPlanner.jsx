import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Api } from '../api/api';
import { CATEGORIES, CAT_COLORS } from '../config';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime, money } from '../utils/format';

// One AI card: header, hint, run button and an output area
function AiCard({ id, title, badge, hint, button, busy, onRun, children }) {
  return (
    <div className="card ai-card rise" id={id}>
      <div className="card-head"><h2>{title}</h2><span className="ai-badge">{badge}</span></div>
      <p className="hint">{hint}</p>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', margin: '12px 0' }}>
        <button className="btn btn-ai" disabled={busy} onClick={onRun}>{busy ? 'Thinking...' : button}</button>
      </div>
      <div className="ai-out">{children}</div>
    </div>
  );
}

export default function AiPlanner() {
  const { current: ev, refresh } = useEvents();
  const toast = useToast();
  const { hash } = useLocation();
  const [busy, setBusy] = useState('');
  const [plan, setPlan] = useState(null);
  const [budget, setBudget] = useState(null);
  const [tasks, setTasks] = useState(null);      // [{...task, picked}]
  const [schedule, setSchedule] = useState(null);
  const [summary, setSummary] = useState(null);
  const [applying, setApplying] = useState('');

  // links like /ai-planner#card-budget scroll to that card
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const input = { type: ev.type, guests: ev.guests, date: ev.date, time: ev.time, budget: ev.budget };

  async function run(name, fn) {
    setBusy(name);
    try { await fn(); } catch (err) { toast(err.message, 'error'); }
    setBusy('');
  }

  async function apply(name, fn, okMsg) {
    setApplying(name);
    try { await fn(); toast(okMsg); } catch (err) { toast(err.message, 'error'); }
    setApplying('');
  }

  return (
    <>
      <p className="hint" style={{ marginBottom: 16 }}>
        Using <strong>{ev.name}</strong> · {ev.type} · {ev.guests} guests · {fmtDate(ev.date)} · budget {money(ev.budget)}
      </p>
      <section className="grid equal">
        <AiCard id="card-plan" title="AI event planner" badge="Suggestions" hint="Planning advice based on event type, guest count, date and budget."
          button="Generate suggestions" busy={busy === 'plan'} onRun={() => run('plan', async () => setPlan(await Api.ai.plan(input)))}>
          {plan && <><strong>{plan.headline}</strong><ul>{plan.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
        </AiCard>

        <AiCard id="card-budget" title="AI budget recommendation" badge="Budget" hint="An approximate split of your budget across the main categories."
          button="Suggest budget split" busy={busy === 'budget'} onRun={() => run('budget', async () => setBudget(await Api.ai.budget(input)))}>
          {budget && <>
            <p className="hint">{budget.note}</p>
            {CATEGORIES.map((c, i) => (
              <div className="list-item" key={c.key}>
                <span><i className="dot" style={{ background: CAT_COLORS[i] }} />{c.label}</span>
                <strong>{money(budget.allocation[c.key])} <small>({budget.percentages[i]}%)</small></strong>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn" disabled={applying === 'budget'}
                onClick={() => apply('budget', async () => { await Api.updateEvent(ev._id, { allocation: budget.allocation }); await refresh(); }, 'Budget split saved')}>Use this split</button>
            </div>
          </>}
        </AiCard>

        <AiCard id="card-tasks" title="AI task generator" badge="Checklist" hint="A preparation checklist for your event type, with deadlines."
          button="Generate checklist" busy={busy === 'tasks'}
          onRun={() => run('tasks', async () => setTasks((await Api.ai.tasks(input)).map(t => ({ ...t, picked: true }))))}>
          {tasks && <>
            {tasks.map((t, i) => (
              <div className="pick" key={i}>
                <input type="checkbox" id={'t' + i} checked={t.picked} onChange={e => setTasks(tasks.map((x, j) => j === i ? { ...x, picked: e.target.checked } : x))} />
                <label htmlFor={'t' + i}>{t.title}</label><small className="muted">{fmtDate(t.deadline)}</small>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn" disabled={applying === 'tasks'}
                onClick={() => apply('tasks', async () => {
                  for (const { picked, ...t } of tasks) if (picked) await Api.add(ev._id, 'tasks', { ...t, done: false });
                }, 'Tasks added to your checklist')}>Add selected tasks</button>
            </div>
          </>}
        </AiCard>

        <AiCard id="card-schedule" title="AI schedule assistant" badge="Timeline" hint="A preparation timeline with key deadlines leading up to the event."
          button="Suggest timeline" busy={busy === 'schedule'} onRun={() => run('schedule', async () => setSchedule(await Api.ai.schedule(input)))}>
          {schedule && <>
            <div className="timeline">
              {schedule.map((a, i) => <div className="t" key={i}><strong>{a.title}</strong><small>{fmtDate(a.date)} · {fmtTime(a.time)}</small></div>)}
            </div>
            <div className="modal-actions">
              <button className="btn" disabled={applying === 'schedule'}
                onClick={() => apply('schedule', async () => { for (const a of schedule) await Api.add(ev._id, 'activities', a); }, 'Timeline added to the schedule')}>Add to my schedule</button>
            </div>
          </>}
        </AiCard>
      </section>

      <section className="card ai-card mt rise" id="card-summary">
        <div className="card-head"><h2>AI event summary</h2><span className="ai-badge">Summary</span></div>
        <p className="hint">A short status report on budget, expenses, guests and pending tasks.</p>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', margin: '12px 0' }}>
          <button className="btn btn-ai" disabled={busy === 'summary'} onClick={() => run('summary', async () => setSummary((await Api.ai.summary(ev._id)).summary))}>
            {busy === 'summary' ? 'Thinking...' : 'Write summary'}
          </button>
        </div>
        <div className="ai-out">{summary && <ul>{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>}</div>
      </section>
    </>
  );
}
