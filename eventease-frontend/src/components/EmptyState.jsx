import { Link } from 'react-router-dom';
import { EmptyArt } from './Illustrations';

export default function EmptyState({ title, text, to, label }) {
  return (
    <div className="card empty rise">
      <EmptyArt />
      <h2>{title}</h2>
      <p>{text}</p>
      {to && <Link className="btn" to={to}>{label}</Link>}
    </div>
  );
}
