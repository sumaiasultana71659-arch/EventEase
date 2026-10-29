import Icon from './Icon';
import Img from './Img';
import { CATEGORIES, CAT_COLORS } from '../config';
import { coverFor } from '../data/images';
import { fmtDate, fmtTime, money } from '../utils/format';

const FIT = {
  great: ['Within budget', 'ok'],
  tight: ['Tight fit', 'warn'],
  resized: ['Sized to budget', 'info']
};

// One suggested event: what it is, what is included, where the money goes, and how well it fits the budget.
export default function SuggestionCard({ s, i = 0, onRequest }) {
  const [fitLabel, fitTone] = FIT[s.fit] || FIT.great;
  const total = CATEGORIES.reduce((n, c) => n + (s.breakdown?.[c.key] || 0), 0) || 1;
  return (
    <article className="card sug rise lift" style={{ '--i': i }}>
      <div className="sug-img">
        <Img src={coverFor(s.type)} type={s.type} alt={s.title} />
        <span className="pill-tag">{s.type}</span>
        <span className={'fit ' + fitTone}>{fitLabel}</span>
      </div>
      <div className="sug-body">
        <h3>{s.title}</h3>
        <p className="sug-theme">{s.theme}</p>
        <p className="sug-desc">{s.description}</p>
        <div className="sug-meta">
          <span><Icon name="pin" />{s.venue}</span>
          <span><Icon name="events" />Suggested {fmtDate(s.date)} · {fmtTime(s.time)}</span>
          <span><Icon name="guests" />{s.guests} guests · book {s.leadWeeks}+ weeks ahead</span>
        </div>
        <ul className="why inc">{s.includes.slice(0, 3).map((w, k) => <li key={k}>{w}</li>)}</ul>
        {s.breakdown && (
          <div className="split" title="Where the budget goes">
            {CATEGORIES.map((c, k) => <i key={c.key} style={{ width: (s.breakdown[c.key] || 0) / total * 100 + '%', background: CAT_COLORS[k] }} title={c.label + ': ' + money(s.breakdown[c.key])} />)}
          </div>
        )}
        {s.fitNote && <p className="fit-note">{s.fitNote}</p>}
      </div>
      <div className="sug-foot">
        <div className="price-box"><strong>{money(s.budget)}</strong><small>{money(s.perGuest)} / guest</small></div>
        <button className="btn" onClick={() => onRequest(s)}>Request this</button>
      </div>
    </article>
  );
}

// suggestion -> prefilled request form values
export const toRequest = s => ({
  name: s.title, type: s.type, guests: s.guests, date: s.date, time: s.time, venue: s.venue, budget: s.budget,
  description: `${s.theme}. ${s.description} Includes: ${s.includes.join('; ')}.`, source: 'ai'
});
