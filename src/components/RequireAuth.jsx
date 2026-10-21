import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

export default function RequireAuth() {
    const { user, loading, error } = useAuth();
    const location = useLocation();

    if (loading) {
        return <main className="page-container"><p>Checking your sign-in...</p></main>;
    }

    if (error) {
        return <main className="page-container"><div className="notice notice-error" role="alert">{error}</div></main>;
    }

    if (!user || user.is_anonymous) {
        const redirect = `${location.pathname}${location.search}`;
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
    }

    return <Outlet />;
}
