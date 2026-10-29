import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CountUp from '../components/CountUp';
import Icon from '../components/Icon';
import Img from '../components/Img';
import RequestModal from '../components/RequestModal';
import SuggestionCard, { toRequest } from '../components/SuggestionCard';
import { Api } from '../api/api';
import { HERO_SLIDES } from '../data/images';
import { useAuth } from '../context/AuthContext';

// Dashboard for a user who has no approved event yet
export default function UserHome() {
  const { user } = useAuth();
  const [reqs, setReqs] = useState([]);
  const [sug, setSug] = useState([]);
  const [req, setReq] = useState(null);
  const [slide, setSlide] = useState(0);

  const load = () => Api.myRequests().then(setReqs).catch(() => {});
  useEffect(() => { load(); Api.ai.suggestions().then(r => setSug(r.suggestions.slice(0, 3))).catch(() => {}); }, []);
  useEffect(() => { const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4500); return () => clearInterval(t); }, []);

  const n = s => reqs.filter(r => r.status === s).length;

  return (
    <>
      <section className="welcome rise">
        {HERO_SLIDES.map((s, i) => <Img key={i} className={'welcome-img' + (i === slide ? ' on' : '')} src={s.src} type={s.type} eager={i === 0} />)}
        <div className="welcome-shade" />
        <div className="welcome-inner">
          <span className="pill">Welcome, {user.name.split(' ')[0]}</span>
          <h2>Let's plan your first event.</h2>
          <p>Share your budget and taste, pick one of our ideas or write your own, and our team will confirm it. Then your guests, checklist and budget are all in one place.</p>
          <div className="cta">
            <Link className="btn btn-ai btn-lg" to="/discover">See event ideas</Link>
            <button className="btn btn-white btn-lg" onClick={() => setReq({})}>Request an event</button>
          </div>
        </div>
      </section>

      <section className="grid stats three">
        {[['pending', 'Waiting for our team', 'inbox', 'orange'], ['approved', 'Approved', 'check', 'green'], ['rejected', 'Rejected', 'close', 'red']].map(([k, l, ico, tone], i) => (
          <Link to="/requests" className="card stat rise lift" style={{ '--i': i + 1 }} key={k}>
            <span className={'badge-ico tone-' + tone}><Icon name={ico} /></span>
            <div><p>{l}</p><strong><CountUp value={n(k)} /></strong></div>
          </Link>
        ))}
      </section>

      {sug.length > 0 && (
        <>
          <div className="card-head sec-head"><h2>Picked for you</h2><Link className="btn btn-ghost btn-sm" to="/discover">See all ideas</Link></div>
          <div className="grid sug-grid">{sug.map((s, i) => <SuggestionCard key={s.title + i} s={s} i={i} onRequest={x => setReq(toRequest(x))} />)}</div>
        </>
      )}
      <RequestModal open={req !== null} initial={req || undefined} onClose={() => setReq(null)} onDone={load} />
    </>
  );
}
