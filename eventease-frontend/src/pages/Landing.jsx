import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { Auth } from '../api/auth';
import { CATEGORY_CARDS, GALLERY, HERO_SLIDES, PHOTO } from '../data/images';

const TOOLS = [
  { ico: 'guests', title: 'Guest list and RSVPs', text: 'Invite people, see who replied and who showed up.' },
  { ico: 'budget', title: 'Budget and expenses', text: 'Split your budget by category and watch every payment.' },
  { ico: 'tasks', title: 'Checklist', text: 'A task list with deadlines, so nothing is left to the last week.' },
  { ico: 'schedule', title: 'Schedule', text: 'Meetings, tastings and rehearsals on one calendar.' },
  { ico: 'ai', title: 'Event ideas', text: 'Formats and costs that fit your budget and guest count.' },
  { ico: 'bell', title: 'Reminders', text: 'Gentle nudges for overdue tasks, replies and spending.' }
];

export default function Landing() {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, [paused]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const go = d => setSlide(s => (s + d + HERO_SLIDES.length) % HERO_SLIDES.length);
  const strip = [...GALLERY, ...GALLERY];
  const start = user ? Auth.homePath(user) : '/register';

  return (
    <div className="lp">
      <header className={'lp-nav' + (scrolled ? ' solid' : '')}>
        <Link to="/" className="brand"><span className="brand-logo">E</span>EventEase</Link>
        <nav className="lp-links">
          <a href="#about">About</a><a href="#events">Events</a><a href="#planning">Planning</a><a href="#ideas">Ideas</a>
        </nav>
        <div className="actions">
          {user
            ? <Link className="btn" to={Auth.homePath(user)}>My dashboard</Link>
            : <><Link className="btn btn-ghost" to="/login">Log in</Link><Link className="btn" to="/register">Get started</Link></>}
        </div>
      </header>

      <section className="lp-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {HERO_SLIDES.map((s, i) => <Img key={i} className={'lp-slide' + (i === slide ? ' on' : '')} src={s.src} type={s.type} alt={s.label} eager={i === 0} />)}
        <div className="lp-shade" />
        <div className="lp-hero-inner">
          <h1>Every celebration, beautifully organised.</h1>
          <p>Weddings, birthdays, corporate events, conferences and concerts. Plan all of it in one calm place.</p>
          <div className="cta">
            <Link className="btn btn-ai btn-lg" to={start}>{user ? 'Open my dashboard' : 'Start planning'}</Link>
            {!user && <Link className="btn btn-white btn-lg" to="/login">Log in</Link>}
          </div>
          <div className="lp-caption" key={slide}><i />{HERO_SLIDES[slide].label}</div>
        </div>
        <button className="lp-arrow l" aria-label="Previous photo" onClick={() => go(-1)}><Icon name="arrow" /></button>
        <button className="lp-arrow r" aria-label="Next photo" onClick={() => go(1)}><Icon name="arrow" /></button>
        <div className="dots lp-dots">{HERO_SLIDES.map((_, i) => <button key={i} aria-label={'Photo ' + (i + 1)} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} />)}</div>
      </section>

      <section className="lp-intro" id="about">
        <Reveal>
          <span className="eyebrow">About EventEase</span>
          <p>We bring every part of an event together: the budget, the guest list, the schedule and all the small details. Tell us what you are celebrating, and we will help you shape it and keep you calm until the day.</p>
          <Link className="text-link" to={start}>See event ideas <Icon name="arrow" /></Link>
        </Reveal>
      </section>

      <section className="lp-strip" aria-label="Event photos">
        <div className="lp-track">{strip.map((g, i) => <div className="lp-tile" key={i}><Img src={g.src} type={g.type} alt="" /></div>)}</div>
      </section>

      <section className="lp-section" id="events">
        <Reveal className="lp-head"><span className="eyebrow">Events</span><h2>Celebrations of every kind</h2></Reveal>
        <div className="lp-cats">
          {CATEGORY_CARDS.map((c, i) => (
            <Reveal className="cat-card" delay={i * 80} key={c.type}>
              <Img src={PHOTO[c.type]} type={c.type} alt={c.type} />
              <div className="cat-shade" />
              <div className="cat-text"><h3>{c.type}</h3><p>{c.text}</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lp-section alt" id="planning">
        <Reveal className="lp-head"><span className="eyebrow">Planning</span><h2>Everything in one place</h2><p>No more spreadsheets, scattered chats or forgotten deadlines.</p></Reveal>
        <div className="lp-grid">
          {TOOLS.map((f, i) => (
            <Reveal className="card feature lift" delay={i * 70} key={f.title}>
              <span className="feature-ico tone-purple"><Icon name={f.ico} /></span>
              <h3>{f.title}</h3><p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lp-section lp-ideas" id="ideas">
        <Reveal className="lp-ideas-photo"><Img src={PHOTO.Venue} type="Wedding" alt="A beautifully set event table" /></Reveal>
        <Reveal className="lp-ideas-text" delay={120}>
          <span className="eyebrow">Ideas</span>
          <h2>Ideas that respect your budget</h2>
          <p>Tell us your budget, guest count and style. We suggest event formats that realistically fit, and we say so honestly when a budget is too tight.</p>
          <ul className="ticks">
            <li><Icon name="check" />A cost split for venue, food, decoration and transport</li>
            <li><Icon name="check" />Dates that give venues and vendors enough time</li>
            <li><Icon name="check" />Send the idea to our team in one click</li>
          </ul>
          <Link className="btn btn-lg" to={start}>{user ? 'Open my dashboard' : 'Create your account'}</Link>
        </Reveal>
      </section>

      <section className="lp-cta">
        <Img src={PHOTO.Festival} type="Concert" alt="" />
        <div className="lp-cta-shade" />
        <Reveal className="lp-cta-in"><h2>Let's plan something worth remembering.</h2>
          <Link className="btn btn-lg btn-white" to={start}>{user ? 'Open my dashboard' : 'Get started'}</Link></Reveal>
      </section>

      <footer className="lp-foot">
        <div className="brand"><span className="brand-logo">E</span>EventEase</div>
        <p>Event planning, made calm.</p>
        <small>Photos by Unsplash contributors</small>
      </footer>
    </div>
  );
}
