
import { Link, Outlet } from 'react-router-dom';
import { ArrowUpRight, Layers3 } from 'lucide-react';

export default function AppLayout() {
    return (
        <>
            <header className="app-nav">
                <Link to="/" className="app-brand"><span className="app-brand-icon"><Layers3 size={17} /></span>PortGen</Link>

                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/manage">My Portfolios</Link>
                    <Link to="/editor" className="app-nav-cta">
                        Create portfolio <ArrowUpRight size={15} />
                    </Link>
                </nav>
            </header>

            <Outlet />
        </>
    );
}
