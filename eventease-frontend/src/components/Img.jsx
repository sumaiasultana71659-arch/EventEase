import { useState } from 'react';
import { EventCover } from './Illustrations';

// Photo with a safe fallback: if the image cannot load, the SVG artwork for that event type is shown instead.
export default function Img({ src, alt = '', type = 'Other', className = '', eager = false, ...rest }) {
  const [bad, setBad] = useState(false);
  const [ok, setOk] = useState(false);
  if (bad || !src) return <div className={'img-fb ' + className}><EventCover type={type} /></div>;
  return (
    <img
      className={'img ' + (ok ? 'loaded ' : '') + className}
      src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
      onLoad={() => setOk(true)} onError={() => setBad(true)} {...rest}
    />
  );
}
