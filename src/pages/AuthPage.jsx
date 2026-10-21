import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

function getSafeRedirect(value) {
    return value?.startsWith('/') &&
        !value.startsWith('//') &&
        !value.includes('\\')
        ? value
        : '/manage';
}

async function getAuthErrorMessage(authError, mode) {
    const context = authError?.context;

    if (context instanceof Response) {
        try {
            const body = await context.clone().json();
            if (typeof body?.error === 'string' && body.error) return body.error;
        } catch {
            // Use a readable fallback if the function response isn't JSON.
        }

        if (context.status === 404) {
            return 'Sign-in is not set up on the server yet. The site owner needs to finish the sign-in setup.';
        }
    }

    if (authError?.name === 'FunctionsFetchError' || authError?.name === 'FunctionsRelayError') {
        return 'The sign-in service is unavailable. Please ask the site owner to finish the sign-in setup.';
    }

    if (mode === 'signin') {
        return 'Invalid username or password. Please check your details and try again.';
    }

    return 'We couldn’t create your account. Please check your details and try again.';
}

export default function AuthPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const [mode, setMode] = useState('signin');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const redirect = getSafeRedirect(searchParams.get('redirect'));

    function getCredentials() {
        const normalizedUsername = username.trim().toLowerCase();

        if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
            throw new Error('Enter a username with 3–24 letters, numbers, or underscores.');
        }

        return normalizedUsername;
    }

    useEffect(() => {
        if (!authLoading && user && !user.is_anonymous) {
            navigate(redirect, { replace: true });
        }
    }, [authLoading, navigate, redirect, user]);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const normalizedUsername = getCredentials();
            const { data, error: authError } = await supabase.functions.invoke('username-auth', {
                body: {
                    action: mode,
                    username: normalizedUsername,
                    ...(mode === 'signup' ? { email: email.trim() } : {}),
                    password,
                },
            });

            if (authError) {
                throw new Error(await getAuthErrorMessage(authError, mode));
            }
            if (data?.error) throw new Error(data.error);
            if (!data?.session?.access_token || !data?.session?.refresh_token) {
                throw new Error('We couldn’t sign you in. Please check your details and try again.');
            }

            const { error: sessionError } = await supabase.auth.setSession(data.session);
            if (sessionError) throw sessionError;
            navigate(redirect, { replace: true });
        } catch (authError) {
            setError(authError.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <Link to="/" className="brand auth-brand" aria-label="PortGen home">
                    <span className="brand-icon"><Layers3 size={19} /></span>
                    <span>Port<span className="brand-dot">G</span>en</span>
                </Link>
                <p className="eyebrow">YOUR PORTFOLIO WORKSPACE</p>
                <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
                <p className="auth-intro">
                    {mode === 'signin'
                        ? 'Sign in with your username to access your private portfolios.'
                        : 'Create a username and password. Your email is only used to register your account.'}
                </p>

                {error && <div className="notice notice-error" role="alert">{error}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            autoComplete="username"
                            minLength={3}
                            maxLength={24}
                            value={username}
                            onChange={event => setUsername(event.target.value)}
                            required
                        />
                    </label>
                    {mode === 'signup' && (
                        <label>
                            Email address
                            <input
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                required
                            />
                        </label>
                    )}
                    <label>
                        Password
                        <input
                            type="password"
                            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                            minLength={mode === 'signup' ? 8 : undefined}
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                        />
                        {mode === 'signup' && (
                            <span className="auth-help">
                                Use at least 8 characters.
                            </span>
                        )}
                    </label>
                    <button className="button button-primary" type="submit" disabled={loading}>
                        {loading
                            ? 'Please wait...'
                            : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                </form>

                <p className="auth-switch">
                    {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                    {' '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin');
                            setError('');
                        }}
                    >
                        {mode === 'signin' ? 'Create an account' : 'Sign in'}
                    </button>
                </p>
            </section>
        </main>
    );
}
