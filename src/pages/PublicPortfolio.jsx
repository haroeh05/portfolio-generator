import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { portfolioExamples } from '../lib/portfolioExamples';

const templateClass = {
    simple: 'public-portfolio public-simple',
    modern: 'public-portfolio public-modern',
    creative: 'public-portfolio public-creative',
};

function ExternalLink({ href, children }) {
    if (!href) return null;
    return <a href={href} target="_blank" rel="noreferrer">{children} <ArrowUpRight size={14} /></a>;
}

export default function PublicPortfolio({ isExample = false }) {
    const { id, template: templateId } = useParams();
    const example = isExample ? portfolioExamples[templateId] : null;
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(!isExample);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isExample) return;

        let active = true;

        async function load() {
            setLoading(true);
            setError('');
            const { data, error: fetchError } = await supabase
                .from('portfolios')
                .select('id, full_name, profile_picture_url, email, contact_number, address, about_me, education, skills, projects, work_experience, social_links, template, is_published')
                .eq('id', id)
                .eq('is_published', true)
                .maybeSingle();
            if (!active) return;
            if (fetchError) setError('We could not load this portfolio. Please try again later.');
            else if (!data) setError('This portfolio is unavailable or has not been published.');
            else setPortfolio(data);
            setLoading(false);
        }
        load();
        return () => { active = false; };
    }, [id, isExample]);

    const displayPortfolio = isExample ? example : portfolio;
    const displayError = isExample
        ? example ? '' : 'This portfolio example could not be found.'
        : error;

    if (!isExample && (loading || (!portfolio && !error))) return <main className="public-state"><p>Loading portfolio…</p></main>;
    if (displayError || !displayPortfolio) return <main className="public-state"><h1>Portfolio unavailable</h1><p>{displayError || 'This portfolio could not be found.'}</p><Link className="button button-primary" to="/">Visit PortGen</Link></main>;

    const skills = Array.isArray(displayPortfolio.skills) ? displayPortfolio.skills : [];
    const education = Array.isArray(displayPortfolio.education) ? displayPortfolio.education : [];
    const projects = Array.isArray(displayPortfolio.projects) ? displayPortfolio.projects : [];
    const experience = Array.isArray(displayPortfolio.work_experience) ? displayPortfolio.work_experience : [];
    const socials = Array.isArray(displayPortfolio.social_links) ? displayPortfolio.social_links : [];
    const template = templateClass[displayPortfolio.template] || templateClass.simple;
    const templateName = ({ simple: 'Simple', modern: 'Modern', creative: 'Creative' })[displayPortfolio.template] || 'Simple';

    return (
        <main className={template}>
            <div className={`public-topbar ${isExample ? 'public-example-topbar' : ''}`}>
                <Link to="/" className="public-brand">PortGen</Link>
                <span>{isExample ? `${templateName} example` : <><Globe size={15} /> Public portfolio</>}</span>
                {isExample && <Link to={`/editor?template=${displayPortfolio.template}`} className="button button-primary public-use-template">Use this template <ArrowUpRight size={15} /></Link>}
            </div>
            <header className="public-hero">
                {displayPortfolio.profile_picture_url ? <img className="public-avatar" src={displayPortfolio.profile_picture_url} alt={`${displayPortfolio.full_name}'s profile`} /> : <div className="public-avatar public-avatar-placeholder">{(displayPortfolio.full_name || '?').charAt(0).toUpperCase()}</div>}
                <p className="public-kicker">PORTFOLIO</p>
                <h1>{displayPortfolio.full_name || 'Untitled portfolio'}</h1>
                {displayPortfolio.about_me && <p className="public-about">{displayPortfolio.about_me}</p>}
                <div className="public-contact">
                    {displayPortfolio.email && <a href={`mailto:${displayPortfolio.email}`}><Mail size={15} />{displayPortfolio.email}</a>}
                    {displayPortfolio.contact_number && <a href={`tel:${displayPortfolio.contact_number}`}><Phone size={15} />{displayPortfolio.contact_number}</a>}
                    {displayPortfolio.address && <span><MapPin size={15} />{displayPortfolio.address}</span>}
                </div>
                {socials.length > 0 && <div className="public-socials">{socials.map((item, i) => <ExternalLink key={`${item.url}-${i}`} href={item.url}>{item.platform || 'Link'}</ExternalLink>)}</div>}
            </header>
            {skills.length > 0 && <section className="public-section"><h2>Skills</h2><div className="public-skills">{skills.map((skill, i) => <span key={`${skill}-${i}`}>{skill}</span>)}</div></section>}
            {projects.some(x => x.name || x.description) && <section className="public-section"><h2>Selected projects</h2><div className="public-cards">{projects.filter(x => x.name || x.description).map((item, i) => <article className="public-card" key={`${item.name}-${i}`}><h3>{item.name || 'Project'}</h3>{item.description && <p>{item.description}</p>}{item.technologies && <p className="public-muted">{item.technologies}</p>}{item.link && <ExternalLink href={item.link}>View project</ExternalLink>}</article>)}</div></section>}
            {experience.some(x => x.position || x.company || x.description) && <section className="public-section"><h2>Experience</h2>{experience.filter(x => x.position || x.company || x.description).map((item, i) => <article className="public-timeline" key={`${item.position}-${i}`}><h3>{item.position || 'Experience'}{item.company ? ` · ${item.company}` : ''}</h3>{item.period && <p className="public-muted">{item.period}</p>}{item.description && <p>{item.description}</p>}</article>)}</section>}
            {education.some(x => x.school || x.degree || x.details) && <section className="public-section"><h2>Education</h2>{education.filter(x => x.school || x.degree || x.details).map((item, i) => <article className="public-timeline" key={`${item.school}-${i}`}><h3>{item.school || 'Education'}</h3>{item.degree && <p>{item.degree}</p>}{item.year && <p className="public-muted">{item.year}</p>}{item.details && <p>{item.details}</p>}</article>)}</section>}
            <footer className="public-footer">Made with <Link to="/">PortGen</Link></footer>
        </main>
    );
}
