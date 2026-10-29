export default function ProgressBar({ pct, extra = '', color }) {
  const p = Math.max(0, Math.min(100, pct));
  const cls = pct > 100 ? 'over' : pct >= 90 ? 'warn' : '';
  return (
    <div className={`progress ${cls} ${extra}`}>
      <i style={{ width: p + '%', ...(color ? { background: color } : {}) }} />
    </div>
  );
}
