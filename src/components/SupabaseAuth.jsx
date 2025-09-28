import { useState, useEffect, useRef } from 'react';
import { signInWithProvider } from '../lib/supabaseAuth';
import { useAuth } from '../contexts/AuthContext';

export default function SupabaseAuth({ isOpen = false, onClose = () => {}, onSignedIn = () => {} }) {
  const [status, setStatus] = useState('');
  const { user: current } = useAuth();

  // Inform parent when current user changes (keep backward compatibility)
  useEffect(() => {
    onSignedIn(current);
  }, [current, onSignedIn]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const modalRef = useRef(null);

  // Reset some transient states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsRedirecting(false);
      setStatus('');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Focus trap and Esc-to-close
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        // focus trap inside modal
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKey);

    // set initial focus to first input in modal
    setTimeout(() => {
      const modal = modalRef.current;
      if (modal) {
        const firstInput = modal.querySelector('input, button');
        if (firstInput) firstInput.focus();
      }
    }, 50);

    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md p-4 transform transition-all duration-150 ease-out"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id="auth-modal-title" className="text-lg font-semibold text-gray-900">Sign in to Booklet</h3>
          <button onClick={onClose} aria-label="Close sign in dialog" className="text-gray-500 hover:text-gray-700 rounded p-1">✕</button>
        </div>

        <div>
          <div className="mb-3">
            <button disabled={isRedirecting} aria-busy={isRedirecting} onClick={async () => {
              setErrorMsg('');
              setIsRedirecting(true);
              setStatus('Redirecting to Google...');
              try {
                const { data, error } = await signInWithProvider('google', { redirectTo: window.location.origin });
                if (error) {
                  setErrorMsg(error.message || String(error));
                  setStatus('');
                  setIsRedirecting(false);
                } else {
                  // Typical behavior: Supabase redirects the browser to provider.
                  // If it returns a URL, navigate to it.
                  if (data?.url) {
                    window.location.href = data.url;
                  }
                }
              } catch (e) {
                setErrorMsg(String(e));
                setStatus('');
                setIsRedirecting(false);
              }
            }} className={`w-full flex items-center justify-center space-x-2 px-3 py-2 border rounded ${isRedirecting ? 'opacity-60 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}>
              {isRedirecting ? (
                <svg className="w-5 h-5 animate-spin text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" strokeWidth="3" className="opacity-75" /></svg>
              ) : (
                <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
              )}
              <span className="text-sm">Continue with Google</span>
            </button>
          </div>

          {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
          <div className="text-sm text-gray-600">{status}</div>
        </div>
      </div>
    </div>
  );
}
