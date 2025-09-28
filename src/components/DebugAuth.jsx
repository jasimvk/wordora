import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { user, profile, loading } = useAuth();
  if (!import.meta.env.DEV) return null;

  return (
    <div style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 9999, maxWidth: '22vw', background: 'rgba(255,255,255,0.95)', border: '1px solid #eee', padding: 8, fontSize: 12, borderRadius: 6 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Auth (DEV)</div>
      <div><strong>loading:</strong> {String(loading)}</div>
      <div style={{ marginTop: 6 }}><strong>user:</strong> {user ? user.email : 'null'}</div>
      <div style={{ marginTop: 6 }}><strong>profile:</strong> {profile ? profile.full_name ?? profile.email : 'null'}</div>
    </div>
  );
}
