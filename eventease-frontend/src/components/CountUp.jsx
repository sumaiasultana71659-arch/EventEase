import { useEffect, useState } from 'react';

// Numbers count up from 0 when they appear (small animation for stat cards)
export default function CountUp({ value, format = n => Math.round(n).toLocaleString(), duration = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(value); return; }
    let raf, start;
    const step = t => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(n)}</>;
}
