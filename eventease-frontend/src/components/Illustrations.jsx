// Inline SVG artwork (no image files needed, works offline).
const COVERS = {
  Wedding:    ['#a8826f', '#7a5a68'],
  Birthday:   ['#c29a5c', '#9c6450'],
  Corporate:  ['#3f5a73', '#2a3d52'],
  Conference: ['#4d7878', '#2f5560'],
  Concert:    ['#65587f', '#3a3556'],
  Other:      ['#7b8981', '#52605a']
};

function Confetti() {
  const dots = [[30, 20, 5], [90, 80, 4], [150, 25, 6], [250, 30, 5], [290, 90, 4], [210, 100, 6], [60, 100, 3], [180, 60, 3]];
  return (
    <g fill="#fff" opacity=".55">
      {dots.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className="twinkle" style={{ animationDelay: i * 0.3 + 's' }} />)}
      <rect x="120" y="90" width="8" height="8" rx="2" transform="rotate(25 124 94)" />
      <rect x="270" y="55" width="8" height="8" rx="2" transform="rotate(-20 274 59)" />
    </g>
  );
}

function Scene({ type }) {
  switch (type) {
    case 'Wedding':
      return (
        <g>
          <circle cx="150" cy="66" r="26" fill="none" stroke="#fff" strokeWidth="6" />
          <circle cx="182" cy="66" r="26" fill="none" stroke="#ffe3f1" strokeWidth="6" />
          <path d="M166 24l5 7 8-1-3 8 6 6-8 2-2 8-6-6-7 4 1-8-8-4 8-4z" fill="#fff" opacity=".9" transform="scale(.7) translate(66 -2)" />
          <path d="M60 78c-8-8-18-16-8-24 6-4 8 2 8 2s2-6 8-2c10 8 0 16-8 24z" fill="#fff" opacity=".85" />
          <path d="M255 60c-6-6-14-12-6-18 5-3 6 1 6 1s1-4 6-1c7 6 0 12-6 18z" fill="#fff" opacity=".75" />
        </g>
      );
    case 'Birthday':
      return (
        <g>
          <rect x="120" y="72" width="80" height="34" rx="6" fill="#fff" />
          <rect x="120" y="72" width="80" height="12" rx="6" fill="#ffd1dc" />
          <rect x="156" y="48" width="8" height="24" rx="2" fill="#fff" opacity=".9" />
          <ellipse cx="160" cy="42" rx="5" ry="8" fill="#ffe66d" className="twinkle" />
          <ellipse cx="70" cy="50" rx="14" ry="18" fill="#fff" opacity=".9" className="bob" />
          <path d="M70 68c0 14-6 20-6 30" stroke="#fff" strokeWidth="2" fill="none" />
          <ellipse cx="252" cy="44" rx="13" ry="17" fill="#ffe66d" className="bob" style={{ animationDelay: '.6s' }} />
          <path d="M252 61c0 14 6 22 6 38" stroke="#fff" strokeWidth="2" fill="none" />
        </g>
      );
    case 'Corporate':
      return (
        <g fill="#fff">
          <rect x="96" y="44" width="46" height="66" rx="4" opacity=".92" />
          <rect x="150" y="26" width="52" height="84" rx="4" />
          <rect x="210" y="56" width="40" height="54" rx="4" opacity=".85" />
          {[0, 1, 2, 3].map(r => [0, 1].map(c => <rect key={r + '-' + c} x={160 + c * 20} y={36 + r * 18} width="10" height="10" rx="2" fill="#8e7cf0" />))}
          {[0, 1, 2].map(r => <rect key={r} x="106" y={54 + r * 18} width="10" height="10" rx="2" fill="#8e7cf0" />)}
        </g>
      );
    case 'Conference':
      return (
        <g>
          <rect x="82" y="26" width="120" height="62" rx="8" fill="#fff" opacity=".95" />
          <path d="M96 74l22-20 18 14 26-26 26 22" fill="none" stroke="#2bb39a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="132" y="88" width="20" height="14" fill="#fff" opacity=".8" />
          <rect x="118" y="100" width="48" height="8" rx="4" fill="#fff" />
          <rect x="226" y="52" width="14" height="30" rx="7" fill="#fff" />
          <path d="M218 72a15 15 0 0 0 30 0M233 87v18" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'Concert':
      return (
        <g>
          <path d="M70 110L100 20h20L98 110zM250 110L220 20h-20l22 90z" fill="#fff" opacity=".28" />
          <circle cx="160" cy="62" r="28" fill="#fff" opacity=".95" />
          <circle cx="160" cy="62" r="10" fill="#fa709a" />
          <path d="M148 94l-8 22M172 94l8 22" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          <path d="M96 40l3 8 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1z" fill="#ffe66d" className="twinkle" />
          <path d="M240 70l3 8 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1z" fill="#ffe66d" className="twinkle" style={{ animationDelay: '.7s' }} />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="160" cy="62" r="30" fill="#fff" opacity=".9" />
          <path d="M160 40l6 15 16 1-12 10 4 16-14-9-14 9 4-16-12-10 16-1z" fill="#a18cd1" />
        </g>
      );
  }
}

export function EventCover({ type = 'Other', className = '' }) {
  const [a, b] = COVERS[type] || COVERS.Other;
  const id = 'cv' + type;
  return (
    <svg className={'cover-art ' + className} viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill={`url(#${id})`} />
      <circle cx="300" cy="10" r="50" fill="#fff" opacity=".12" />
      <circle cx="10" cy="120" r="46" fill="#fff" opacity=".1" />
      <Confetti />
      <Scene type={type} />
    </svg>
  );
}

// Big colourful art for the login / register side panel and landing hero
export function HeroArt({ className = '' }) {
  return (
    <svg className={'hero-art ' + className} viewBox="0 0 480 420" aria-hidden="true">
      <defs>
        <linearGradient id="ha1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8e7cf0" /><stop offset="1" stopColor="#F26CF9" /></linearGradient>
        <linearGradient id="ha2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#efeaff" /></linearGradient>
      </defs>
      <circle cx="240" cy="210" r="190" fill="url(#ha1)" opacity=".16" />
      <circle cx="240" cy="210" r="130" fill="url(#ha1)" opacity=".18" />
      <g className="float">
        <rect x="90" y="70" width="300" height="230" rx="22" fill="url(#ha2)" stroke="#e1d9ff" strokeWidth="2" />
        <rect x="90" y="70" width="300" height="52" rx="22" fill="url(#ha1)" />
        <rect x="90" y="100" width="300" height="22" fill="url(#ha1)" />
        <circle cx="122" cy="96" r="7" fill="#fff" opacity=".9" /><circle cx="144" cy="96" r="7" fill="#fff" opacity=".6" /><circle cx="166" cy="96" r="7" fill="#fff" opacity=".4" />
        {[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={116 + (i % 3) * 86} y={146 + Math.floor(i / 3) * 62} width="72" height="46" rx="10" fill={['#ffe3f1', '#e0f7ec', '#fff1d6', '#e3e8ff', '#fde0ff', '#d9f1ff'][i]} />)}
        <rect x="128" y="160" width="36" height="8" rx="4" fill="#F26CF9" /><rect x="128" y="176" width="22" height="6" rx="3" fill="#F26CF9" opacity=".4" />
        <rect x="214" y="160" width="36" height="8" rx="4" fill="#1E9E6A" /><rect x="214" y="176" width="22" height="6" rx="3" fill="#1E9E6A" opacity=".4" />
        <rect x="300" y="160" width="36" height="8" rx="4" fill="#F2A93B" /><rect x="300" y="176" width="22" height="6" rx="3" fill="#F2A93B" opacity=".4" />
        <rect x="128" y="222" width="36" height="8" rx="4" fill="#6C5CE7" /><rect x="214" y="222" width="36" height="8" rx="4" fill="#d156e0" /><rect x="300" y="222" width="36" height="8" rx="4" fill="#3aa0e8" />
      </g>
      <g className="bob"><ellipse cx="62" cy="120" rx="26" ry="34" fill="#F26CF9" /><path d="M62 154c0 26-10 34-10 60" stroke="#c43ccc" strokeWidth="3" fill="none" /></g>
      <g className="bob" style={{ animationDelay: '.8s' }}><ellipse cx="426" cy="150" rx="24" ry="31" fill="#F2A93B" /><path d="M426 181c0 24 10 34 10 58" stroke="#c98716" strokeWidth="3" fill="none" /></g>
      <g className="bob" style={{ animationDelay: '1.4s' }}><ellipse cx="400" cy="60" rx="18" ry="24" fill="#5BA8F5" /><path d="M400 84c0 18-6 26-6 42" stroke="#3a86d4" strokeWidth="3" fill="none" /></g>
      <g className="float" style={{ animationDelay: '.5s' }}>
        <rect x="300" y="262" width="140" height="70" rx="16" fill="#fff" stroke="#e1d9ff" strokeWidth="2" />
        <circle cx="332" cy="297" r="18" fill="#E2F6EC" /><path d="M323 297l7 7 12-14" stroke="#1E9E6A" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="358" y="284" width="64" height="9" rx="4" fill="#37437D" /><rect x="358" y="301" width="42" height="7" rx="3" fill="#bfc4de" />
      </g>
      {[[40, 300, 6], [450, 330, 5], [200, 380, 7], [120, 40, 5], [330, 30, 6], [20, 210, 4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={['#F26CF9', '#F2A93B', '#1E9E6A', '#5BA8F5', '#F26CF9', '#6C5CE7'][i]} className="twinkle" style={{ animationDelay: i * 0.4 + 's' }} />)}
    </svg>
  );
}

export function EmptyArt() {
  return (
    <svg className="empty-art" viewBox="0 0 160 110" aria-hidden="true">
      <circle cx="80" cy="56" r="46" fill="#efeaff" />
      <rect x="46" y="30" width="68" height="54" rx="10" fill="#fff" stroke="#d9cffc" strokeWidth="2" />
      <rect x="46" y="30" width="68" height="16" rx="10" fill="#8e7cf0" />
      <rect x="46" y="38" width="68" height="8" fill="#8e7cf0" />
      <rect x="56" y="56" width="20" height="8" rx="4" fill="#F26CF9" opacity=".7" /><rect x="82" y="56" width="22" height="8" rx="4" fill="#d9cffc" />
      <rect x="56" y="70" width="30" height="8" rx="4" fill="#d9cffc" />
      <circle cx="122" cy="26" r="5" fill="#F2A93B" className="twinkle" /><circle cx="38" cy="78" r="4" fill="#1E9E6A" className="twinkle" style={{ animationDelay: '.6s' }} />
    </svg>
  );
}
