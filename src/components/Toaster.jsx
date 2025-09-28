import React from 'react';
import { useToast } from '../contexts/ToastContext';

export default function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div aria-live="polite" className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded shadow-md text-sm ${t.type === 'success' ? 'bg-green-500 text-white' : t.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
          <div className="flex items-center justify-between">
            <div>{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="ml-3 opacity-80">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
