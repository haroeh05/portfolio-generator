import { supabase } from './supabase';

export async function requireAuthenticatedUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user || data.user.is_anonymous) {
        throw new Error('Sign in to access your portfolios.');
    }

    return data.user;
}
