import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { auth, googleProvider, signInWithPopup, signOut as fbSignOut } from '../../lib/firebase';
import { supabase, ensureSupabaseHealthy } from '../../lib/supabase';



import { analyticsService } from '../../services/analytics.service';

const isMissingThemePreferenceError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
  return message.includes('theme_preference');
};

const buildFallbackProfile = (firebaseUser: User) => {
  const email = firebaseUser.email || '';
  return {
    id: firebaseUser.uid,
    firebase_uid: firebaseUser.uid,
    name: firebaseUser.displayName || email.split('@')[0] || 'Student',
    email: email || 'student@onecampus.edu',
    profile_photo: firebaseUser.photoURL || '',
    role: email === 'devaprasanna0852@gmail.com' || email.includes('admin') ? 'admin' : 'student',
    login_count: 1,
    theme_preference: 'light',
    first_login: new Date().toISOString(),
  };
};


interface AuthContextType {

  user: User | null;
  profile: any | null;
  loading: boolean;
  updateProfile: (profile: any | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile details to Supabase users table
  const syncProfile = async (firebaseUser: User) => {
    const email = firebaseUser.email || '';
    const name = firebaseUser.displayName || email.split('@')[0] || 'Student';
    const role = email === 'devaprasanna0852@gmail.com' || email.includes('admin') ? 'admin' : 'student';


    // Build a payload for the DB row.
    // IMPORTANT: NEVER set `id` (UUID PK) to Firebase UID.
    // Let Postgres generate `users.id` (uuid_generate_v4()).
    const userInsertPayload = {
      firebase_uid: firebaseUser.uid,
      name,
      email,
      profile_photo: firebaseUser.photoURL || '',
      role,
      login_count: 1,
      theme_preference: 'light',
    };

    try {
      await ensureSupabaseHealthy();



      console.log('[auth] Syncing user to Supabase users table...');

      // Use maybeSingle() because user may not exist
      const { data: existingUser, error: existingErr } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .maybeSingle();

      if (existingErr) {
        console.error('[auth] Supabase select users error:', existingErr);
        throw existingErr;
      }

      if (!existingUser) {
        console.log('[auth] User not found. Inserting new user.');
        let { data: inserted, error: insertErr } = await supabase
          .from('users')
          .insert(userInsertPayload)
          .select('*')
          .maybeSingle();

        if (insertErr && isMissingThemePreferenceError(insertErr)) {
          const payloadWithoutTheme = { ...userInsertPayload };
          delete (payloadWithoutTheme as Partial<typeof userInsertPayload>).theme_preference;
          const retry = await supabase
            .from('users')
            .insert(payloadWithoutTheme)
            .select('*')
            .maybeSingle();
          inserted = retry.data;
          insertErr = retry.error;
        }

        if (insertErr) {
          console.error('[auth] Supabase insert users error:', insertErr);
          throw insertErr;
        }

        if (!inserted) {
          throw new Error('Supabase insert succeeded but returned no user row');
        }

        setProfile(inserted);

        const userId = (inserted as any).id;
        await analyticsService.logActivity(userId, 'first_login', { login_count: 1 });
      } else {
        const loginCount = (existingUser.login_count || 1) + 1;
        console.log('[auth] User found. Updating login_count:', loginCount);

        let { error: updateErr } = await supabase
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            login_count: loginCount,
            name: firebaseUser.displayName || existingUser.name,
            profile_photo: firebaseUser.photoURL || existingUser.profile_photo,
            theme_preference: existingUser.theme_preference || 'light',
          })
          .eq('id', existingUser.id);

        if (updateErr && isMissingThemePreferenceError(updateErr)) {
          const retry = await supabase
            .from('users')
            .update({
              last_login: new Date().toISOString(),
              login_count: loginCount,
              name: firebaseUser.displayName || existingUser.name,
              profile_photo: firebaseUser.photoURL || existingUser.profile_photo,
            })
            .eq('id', existingUser.id);
          updateErr = retry.error;
        }

        if (updateErr) {
          console.error('[auth] Supabase update users error:', updateErr);
          throw updateErr;
        }

        setProfile({ ...existingUser, login_count: loginCount, theme_preference: existingUser.theme_preference || 'light' });
        await analyticsService.logActivity(existingUser.id, 'login', { login_count: loginCount });
      }
    } catch (e) {
      console.error('[auth] Profile sync failed (no mock fallback):', e);
      const fallbackProfile = buildFallbackProfile(firebaseUser);
      setProfile(fallbackProfile);
      return fallbackProfile;
    }

  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          await syncProfile(firebaseUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('[auth] Auth state handling failed:', e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Sign-in with Google failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (profile?.id) {
        await analyticsService.logActivity(profile.id, 'logout');
      }
      await fbSignOut(auth);
    } catch (e) {
      console.error('Sign-out failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile: setProfile, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
