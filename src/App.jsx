import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import PortfolioEditor from './pages/PortfolioEditor.jsx';
import ManagePortfolios from './pages/ManagePortfolios.jsx';
import PublicPortfolio from './pages/PublicPortfolio.jsx';
import AppLayout from './components/AppLayout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { AuthProvider } from './lib/AuthContext.jsx';

function HomePageRoute() {
    const navigate = useNavigate();

    return <HomePage onGetStarted={template => navigate(`/editor?template=${template || 'simple'}`)} />;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePageRoute />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/examples/:template" element={<PublicPortfolio isExample />} />
                    <Route path="/p/:id" element={<PublicPortfolio />} />
                    <Route element={<RequireAuth />}>
                        <Route element={<AppLayout />}>
                            <Route path="/editor" element={<PortfolioEditor />} />
                            <Route path="/editor/:id" element={<PortfolioEditor />} />
                            <Route path="/manage" element={<ManagePortfolios />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
