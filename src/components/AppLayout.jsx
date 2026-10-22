
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layers3 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

export default function AppLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const accountName =
        user?.user_metadata?.username ||
        user?.user_metadata?.user_name ||
        user?.email?.split('@')[0] ||
        'Account';

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
                    <div className="app-nav-account">
                        <div
                            className="nav-account-chip app-nav-user"
                            title={`Signed in as ${accountName}`}
                        >
                            <span className="nav-account-avatar">
                                {accountName.charAt(0).toUpperCase()}
                            </span>
                            <span className="nav-account-name">
                                {accountName}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="nav-signout app-nav-signout"
                            onClick={handleSignOut}
                        >
                            Sign out
                        </button>
                    </div>
                </nav>
            </header>

            {error && <div className="page-container"><div className="notice notice-error" role="alert">{error}</div></div>}
            <Outlet />
        </>
    );
}
