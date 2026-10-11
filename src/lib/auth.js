
import { supabase } from './supabase';

export async function ensureSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (data.session?.user) {
        return data.session.user;
    }

    const { data: signInData, error: signInError } =
        await supabase.auth.signInAnonymously();

    if (signInError) throw signInError;

    if (!signInData.user) {
        throw new Error('Unable to create a user session.');
    }

    return signInData.user;
}
