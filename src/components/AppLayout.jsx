
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layers3 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

export default function AppLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    async function handleSignOut() {
        setError('');
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch (signOutError) {
            setError(signOutError.message || 'Unable to sign out.');
        }
    }

    return (
        <>
            <header className="app-nav">
                <Link to="/" className="app-brand"><span className="app-brand-icon"><Layers3 size={17} /></span>PortGen</Link>

                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/manage">My Portfolios</Link>
                    <span className="app-nav-user">{user?.user_metadata?.username || user?.email}</span>
                    <button type="button" className="app-nav-signout" onClick={handleSignOut}>Sign out</button>
                </nav>
            </header>

            {error && <div className="page-container"><div className="notice notice-error" role="alert">{error}</div></div>}
            <Outlet />
        </>
    );
}
