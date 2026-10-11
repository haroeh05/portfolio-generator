
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ensureSession } from '../lib/auth';

function getStoragePath(publicUrl) {
    const marker = '/storage/v1/object/public/profile-images/';
    if (!publicUrl?.includes(marker)) return null;

    const path = publicUrl.split(marker)[1]?.split('?')[0];
    if (!path) return null;

    const decoded = decodeURIComponent(path);
    return decoded.includes('..') ? null : decoded;
}

export default function ManagePortfolios() {
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState('');

    const loadPortfolios = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            await ensureSession();

            const { data, error: fetchError } = await supabase
                .from('portfolios')
                .select(
                    'id, full_name, email, profile_picture_url, template, is_published, updated_at'
                )
                .order('updated_at', { ascending: false });

            if (fetchError) throw fetchError;

            setPortfolios(data || []);
        } catch (err) {
            setError(err.message || 'Unable to load your portfolios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPortfolios();
    }, [loadPortfolios]);

    async function copyPublicLink(portfolio) {
        const url = `${window.location.origin}/p/${portfolio.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setError('');
            window.alert('Public portfolio link copied to clipboard.');
        } catch {
            window.prompt('Copy your public portfolio link:', url);
        }
    }

    async function deletePortfolio(portfolio) {
        const confirmed = window.confirm(
            `Delete the portfolio for "${portfolio.full_name || 'this portfolio'}"? This cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(portfolio.id);
        setError('');

        try {
            await ensureSession();

            // Delete the database record first. If this fails, retain the image.
            const { error: deleteError } = await supabase
                .from('portfolios')
                .delete()
                .eq('id', portfolio.id);

            if (deleteError) throw deleteError;

            setPortfolios(previous =>
                previous.filter(item => item.id !== portfolio.id)
            );

            // Remove the associated image after the record is deleted.
            const imagePath = getStoragePath(portfolio.profile_picture_url);

            if (imagePath) {
                const { error: imageError } = await supabase.storage
                    .from('profile-images')
                    .remove([imagePath]);

                if (imageError) {
                    console.warn('Portfolio deleted, but image cleanup failed:', imageError.message);
                    setError(
                        'Portfolio deleted successfully, but its old profile image could not be removed.'
                    );
                }
            }
        } catch (err) {
            setError(err.message || 'Unable to delete this portfolio.');
        } finally {
            setDeletingId('');
        }
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">YOUR WORKSPACE</p>
                    <h1>Manage portfolios</h1>
                    <p>View, edit, or delete the portfolios you have saved.</p>
                </div>

                <Link to="/editor" className="button button-primary">
                    + New portfolio
                </Link>
            </div>

            {error && (
                <div className="notice notice-error" role="alert">{error}</div>
            )}

            {loading ? (
                <div className="empty-state">
                    <p>Loading your portfolios...</p>
                </div>
            ) : portfolios.length === 0 ? (
                <div className="empty-state">
                    <h2>No portfolios yet</h2>
                    <p>Create your first portfolio to see it here.</p>
                    <Link to="/editor" className="button button-primary">
                        Create your first portfolio
                    </Link>
                </div>
            ) : (
                <div className="portfolio-list">
                    {portfolios.map(portfolio => (
                        <article className="portfolio-card" key={portfolio.id}>
                            {portfolio.profile_picture_url ? (
                                <img
                                    className="portfolio-avatar"
                                    src={portfolio.profile_picture_url}
                                    alt=""
                                />
                            ) : (
                                <div className="portfolio-avatar avatar-placeholder">
                                    {(portfolio.full_name || '?').charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="portfolio-card-content">
                                <h2>{portfolio.full_name || 'Untitled portfolio'}</h2>
                                <p>{portfolio.email || 'No email added'}</p>
                                <div className="portfolio-meta">
                                    <span className="template-tag">
                                        {portfolio.template || 'simple'}
                                    </span>
                                    <span className={`template-tag ${portfolio.is_published ? 'published-tag' : 'private-tag'}`}>
                                        {portfolio.is_published ? 'Published' : 'Private'}
                                    </span>
                                    <span>
                                        Updated {new Date(portfolio.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="portfolio-card-actions">
                                <Link
                                    to={`/editor/${portfolio.id}`}
                                    className="button button-secondary"
                                >
                                    Edit
                                </Link>

                                {portfolio.is_published && (
                                    <>
                                        <Link to={`/p/${portfolio.id}`} className="button button-secondary" target="_blank">
                                            <ExternalLink size={15} /> View public
                                        </Link>
                                        <button type="button" className="button button-secondary" onClick={() => copyPublicLink(portfolio)}>
                                            <Copy size={15} /> Copy link
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    className="button button-danger"
                                    disabled={deletingId === portfolio.id}
                                    onClick={() => deletePortfolio(portfolio)}
                                >
                                    {deletingId === portfolio.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
