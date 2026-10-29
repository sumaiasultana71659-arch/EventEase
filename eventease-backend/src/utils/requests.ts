import { serialize } from './serialize';

interface RequestRow {
  id: string; userId: string; createdAt: Date; reviewedAt: Date | null;
  user?: { id: string; name: string; email: string } | null;
}

// Frontend shape: _id, "" instead of null, ISO dates, and the requester's name/email for the admin
export function serializeRequest(r: RequestRow) {
  const { user, ...rest } = r;
  return {
    ...serialize(rest),
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt ?? '',
    user: user ? { _id: user.id, name: user.name, email: user.email } : undefined
  };
}
