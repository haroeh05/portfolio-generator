import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!active) return;
            setSession(nextSession);
            setError('');
            setLoading(false);
        });

        supabase.auth.getSession()
            .then(({ data, error: sessionError }) => {
                if (!active) return;
                if (sessionError) throw sessionError;
                setSession(data.session);
                setError('');
            })
            .catch(sessionError => {
                if (active) setError(sessionError.message || 'Unable to check your sign-in status.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    async function signOut() {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
    }

    return (
        <AuthContext.Provider value={{ session, user: session?.user || null, loading, error, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
