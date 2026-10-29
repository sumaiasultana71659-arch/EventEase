import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Img from '../components/Img';
import { HERO_SLIDES } from '../data/images';

// Left: photos sliding behind the text. Right: the form (shared by Login and Register).
export default function AuthShell({ heading, text, children }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n + 1) % HERO_SLIDES.length), 4500); return () => clearInterval(t); }, []);
  return (
    <div className="auth">
      <section className="auth-side">
        {HERO_SLIDES.map((s, k) => <Img key={k} className={'auth-img' + (k === i ? ' on' : '')} src={s.src} type={s.type} eager={k === 0} />)}
        <div className="auth-shade" />
        <div className="auth-copy">
          <Link to="/" className="brand" style={{ padding: 0 }}><span className="brand-logo">E</span>EventEase</Link>
          <h1>{heading}</h1>
          <p>{text}</p>
          <div className="dots">{HERO_SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        </div>
      </section>
      <section className="auth-form"><div className="auth-box page-enter">{children}</div></section>
    </div>
  );
}
