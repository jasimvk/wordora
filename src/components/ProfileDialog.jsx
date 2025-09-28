import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ProfileDialog({ isOpen = false, onClose = () => {} }) {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFullName(profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? '');
  }, [isOpen, profile, user]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e && e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload = { id: user.id, full_name: fullName, email: user.email };
      const { data, error } = await supabase.from('profiles').upsert(payload).select().single();
      if (error) {
        showToast({ type: 'error', message: error.message || 'Failed to save profile' });
      } else {
        showToast({ type: 'success', message: 'Profile saved' });
        await refreshProfile(user.id, { ...user, email: user.email });
        onClose();
      }
    } catch (err) {
      showToast({ type: 'error', message: String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Profile</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700 rounded p-1">✕</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-800">{(user?.email || '').charAt(0).toUpperCase()}</div>
            )}
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 rounded border bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500" />

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 bg-red-500 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
