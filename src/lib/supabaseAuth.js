import { supabase } from './supabaseClient';

// Auth helpers (email + password)
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function resetPasswordForEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function getCurrentUser() {
  return supabase.auth.getUser();
}

// OAuth sign-in (Google, GitHub, etc.)
export async function signInWithProvider(provider, options = {}) {
  // provider: 'google' | 'github' | ...
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options });
  return { data, error };
}
