import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({ user: null, session: null, profile: null });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (uid, userObj = null) => {
    if (!uid) return setProfile(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (error || !data) {
        if (userObj) {
          const name = userObj.user_metadata?.full_name ?? userObj.user_metadata?.name ?? null;
          const email = userObj.email ?? null;
          try {
            const { data: upserted, error: upsertErr } = await supabase.from('profiles').upsert({ id: uid, full_name: name, email }).select().single();
            if (!upsertErr) {
              setProfile(upserted ?? null);
              return;
            }
          } catch (e) {
            // ignore and fall through
          }
        }
        setProfile(null);
      } else {
        setProfile(data ?? null);
      }
    } catch (e) {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Try to pick up session from OAuth redirect URL
        try {
          const { data: urlData } = await supabase.auth.getSessionFromUrl();
          if (!mounted) return;
          if (urlData?.session) {
            const sess = urlData.session;
            const usr = sess.user ?? null;
            setSession(sess);
            setUser(usr);
            if (usr) await refreshProfile(usr.id, usr);
            // clean URL
            try { const cleanUrl = window.location.origin + window.location.pathname; window.history.replaceState({}, document.title, cleanUrl); } catch (e) {}
            return;
          }
        } catch (e) {
          // ignore and continue
        }

        // Normal session lookup
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        let sess = data.session ?? null;
        let usr = sess?.user ?? null;

        // Check if session is expired
        if (sess && sess.expires_at && new Date(sess.expires_at * 1000) < new Date()) {
          sess = null;
          usr = null;
        }

        // If there's no session yet, do a few quick retries
        if (!sess) {
          const maxRetries = 6;
          for (let i = 0; i < maxRetries && !sess && mounted; i++) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, 500));
            // eslint-disable-next-line no-await-in-loop
            const { data: retryData } = await supabase.auth.getSession();
            sess = retryData.session ?? null;
            usr = sess?.user ?? null;
          }
        }

        // Fallback: explicit getUser may return a user even if session wasn't inlined
        if (!usr) {
          try {
            const gu = await supabase.auth.getUser();
            const maybeUser = gu?.data?.user ?? null;
            if (maybeUser) usr = maybeUser;
          } catch (e) {
            // ignore
          }
        }

        setSession(sess);
        setUser(usr);
        if (usr) await refreshProfile(usr.id, usr);

        // Short polling fallback: sometimes tokens are written a moment later (cover edge cases)
        if (!usr && mounted) {
          try {
            let attempts = 0;
            const maxAttempts = 8;
            while (mounted && attempts < maxAttempts && !usr) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(r => setTimeout(r, 1000));
              // eslint-disable-next-line no-await-in-loop
              const { data: s2 } = await supabase.auth.getSession();
              const sess2 = s2?.session ?? null;
              // eslint-disable-next-line no-await-in-loop
              const { data: u2 } = await supabase.auth.getUser();
              const maybeUser2 = u2?.data?.user ?? null;
              if (sess2 || maybeUser2) {
                sess = sess2 ?? sess;
                usr = maybeUser2 ?? usr;
                setSession(sess);
                setUser(usr);
                if (usr) await refreshProfile(usr.id, usr);
                break;
              }
              attempts += 1;
            }
          } catch (e) { /* ignore */ }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, payload) => {
      const sess = payload.session ?? null;
      const usr = sess?.user ?? null;
      setSession(sess);
      setUser(usr);
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setProfile(null);
      } else if (usr) {
        refreshProfile(usr.id);
      }
    });

    return () => {
      mounted = false;
      try { listener.subscription.unsubscribe(); } catch (e) {}
    };
  }, [refreshProfile]);

  // Additional sync on mount and visibility change to catch any missed sessions
  useEffect(() => {
    const sync = () => syncAuth();
    sync(); // sync on mount
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  // optional: manual sync function to reconcile supabase client state with context
  const syncAuth = async () => {
    try {
      const { data: s } = await supabase.auth.getSession();
      const sess = s?.session ?? null;
      const { data: u } = await supabase.auth.getUser();
      const maybeUser = u?.data?.user ?? null;
      setSession(sess);
      setUser(maybeUser ?? sess?.user ?? null);
      if (maybeUser) await refreshProfile(maybeUser.id, maybeUser);
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut, syncAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
