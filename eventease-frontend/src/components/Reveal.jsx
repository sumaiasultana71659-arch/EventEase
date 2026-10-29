import { useEffect, useRef, useState } from 'react';

// true once the element has scrolled into view (stays true afterwards)
export function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

// Fades and slides its children up when they scroll into view
export default function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const [ref, seen] = useInView();
  return (
    <Tag ref={ref} className={'reveal ' + (seen ? 'in ' : '') + className} style={{ transitionDelay: delay + 'ms' }} {...rest}>
      {children}
    </Tag>
  );
}
