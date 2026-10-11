
import { ArrowRight, Layers3, Sparkles, Check, MoveUpRight } from "lucide-react";
import { Eye } from "lucide-react";
import { Link } from 'react-router-dom';

const templates = [
    {
        number: "01",
        name: "Simple",
        description: "A clean, professional portfolio that puts your experience first.",
        style: "simple",
        tags: ["Minimal", "Professional"],
    },
    {
        number: "02",
        name: "Modern",
        description: "A structured layout with cards, clear sections, and visual details.",
        style: "modern",
        tags: ["Structured", "Contemporary"],
    },
    {
        number: "03",
        name: "Creative",
        description: "An expressive layout for showcasing ideas and standout projects.",
        style: "creative",
        tags: ["Expressive", "Distinctive"],
    },
];

function TemplateMockup({ style }) {
    return (
        <div className={`template-mockup mockup-${style}`}>
            {style === "simple" && (
                <>
                    <div className="mock-simple-header">
                        <span className="mock-avatar" />
                        <div>
                            <div className="mock-line long" />
                            <div className="mock-line short" />
                        </div>
                    </div>
                    <div className="mock-line medium" />
                    <div className="mock-line long" />
                    <div className="mock-section-label">ABOUT ME</div>
                    <div className="mock-line long" />
                    <div className="mock-line medium" />
                    <div className="mock-section-label">SELECTED WORK</div>
                    <div className="mock-project-row">
                        <span /><span /><span />
                    </div>
                </>
            )}

            {style === "modern" && (
                <>
                    <div className="mock-modern-header">
                        <span className="mock-avatar" />
                        <div className="mock-line long" />
                    </div>
                    <div className="mock-modern-hero">
                        <div className="mock-line long" />
                        <div className="mock-line medium" />
                    </div>
                    <div className="mock-section-label">SKILLS & EXPERTISE</div>
                    <div className="mock-modern-grid">
                        <span /><span /><span /><span />
                    </div>
                    <div className="mock-section-label">FEATURED PROJECTS</div>
                    <div className="mock-project-row"><span /><span /></div>
                </>
            )}

            {style === "creative" && (
                <>
                    <div className="mock-creative-top">
                        <span>PORTFOLIO / 2026</span>
                        <span>✳</span>
                    </div>
                    <div className="mock-creative-title">HELLO,<br />WORLD.</div>
                    <div className="mock-creative-bottom">
                        <span className="mock-avatar" />
                        <div>
                            <div className="mock-line medium" />
                            <div className="mock-line short" />
                        </div>
                    </div>
                    <div className="mock-creative-blocks"><span /><span /><span /></div>
                </>
            )}
        </div>
    );
}

function HomePage({ onGetStarted }) {
    const startWith = (template) => onGetStarted?.(template);

    return (
        <div className="app-shell">
            <header className="navbar">
                <a className="brand" href="#home" aria-label="PortGen home">
                    <span className="brand-icon"><Layers3 size={19} /></span>
                    <span>Port<span className="brand-dot">G</span>en</span>
                </a>

                <nav className="nav-links">
                    <a href="#how-it-works">Wondering how it works?</a>
                </nav>

                <div className="nav-actions">
                    <Link to="/manage" className="nav-manage">My Portfolios</Link>
                    <a
                        className="nav-cta"
                        href="#templates"
                        onClick={(event) => {
                            event.preventDefault();
                            document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Make Portfolio <ArrowRight size={16} />
                    </a>
                </div>
            </header>

            <main>
                <section className="hero" id="home">
                    <div className="hero-copy">
                        <div className="eyebrow"><Sparkles size={15} /> YOUR WORK, OUT IN THE WORLD</div>

                        <h1>
                            Make your next
                            <br />
                            <span>move memorable.</span>
                        </h1>

                        <p className="hero-description">
                            Choose a template, add your portfolio information, and save your work.
                            Publish it whenever you are ready to share a link.
                        </p>

                        <div className="hero-actions">
                            <a
                                className="button-primary"
                                href="#templates"
                                onClick={(event) => {
                                    event.preventDefault();
                                    document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Choose your template <ArrowRight size={17} />
                            </a>
                            <a className="button-secondary" href="#how-it-works">
                                See how it works <MoveUpRight size={16} />
                            </a>
                        </div>

                        <div className="hero-trust">
                            <span><Check size={15} /> Free to create</span>
                            <span><Check size={15} /> Publish on your terms</span>
                        </div>
                    </div>

                    <div className="hero-art">
                        <div className="hero-paper">
                            <div className="paper-top">
                                <span className="paper-dot" />
                                <span className="paper-dot" />
                                <span className="paper-dot" />
                                <span className="paper-label">LIVE PREVIEW · 01</span>
                            </div>
                            <div className="paper-content">
                                <div className="paper-avatar" />
                                <div className="paper-kicker">INDEPENDENT DESIGNER</div>
                                <div className="paper-name">Alex Morgan</div>
                                <div className="paper-role">Digital products with a human point of view.</div>
                                <div className="paper-divider" />
                                <div className="paper-heading">RECENTLY, I HAVE BEEN...</div>
                                <div className="paper-line" />
                                <div className="paper-line paper-line-short" />
                                <div className="paper-project-heading">
                                    <span>SELECTED WORK</span><span>2022 — 2026</span>
                                </div>
                                <div className="paper-projects">
                                    <span>01</span><span>02</span><span>03</span>
                                </div>
                            </div>
                        </div>
                        <div className="hero-art-caption"><span className="status-dot" /> A good first impression, made yours.</div>
                    </div>
                </section>

                <section className="templates-section" id="templates">
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow">THREE DISTINCT DIRECTIONS</div>
                            <h2>Start with a point of view.</h2>
                            <p>Every layout is built to carry your details from draft to published page.</p>
                        </div>
                        <span className="template-count">01 — 03</span>
                    </div>

                    <div className="template-grid">
                        {templates.map((template) => (
                            <article className={`template-card template-card-${template.style}`} key={template.style}>
                                <TemplateMockup style={template.style} />
                                <div className="template-card-info">
                                    <div className="template-title-row">
                                        <h3>{template.name}</h3>
                                        <span className="template-number">{template.number}</span>
                                    </div>
                                    <p>{template.description}</p>
                                    <div className="tag-row">
                                        {template.tags.map((tag) => (
                                            <span className="tag" key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                    <div className="template-actions">
                                        <button className="template-select" type="button" onClick={() => startWith(template.style)}>
                                            Start with {template.name} <ArrowRight size={16} />
                                        </button>
                                        <Link className="template-example" to={`/examples/${template.style}`} aria-label={`See ${template.name} example`}>
                                            <Eye size={15} /><span>Example</span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="process-section" id="how-it-works">
                    <div className="process-intro">
                        <div className="eyebrow">HOW IT WORKS</div>
                    </div>
                    <div className="process-steps">
                        <article><span>01</span><h3>Choose a template</h3><p>Start with Simple, Modern, or Creative. You can switch templates in the editor.</p></article>
                        <article><span>02</span><h3>Add your information</h3><p>Enter your profile, education, skills, projects, experience, and links.</p></article>
                        <article><span>03</span><h3>Save and share</h3><p>Save your portfolio, then publish it when you are ready to share a link.</p></article>
                    </div>
                    <button className="process-cta" type="button" onClick={() => document.querySelector('#templates')?.scrollIntoView({ behavior: 'smooth' })}>Choose a template <ArrowRight size={16} /></button>
                </section>
            </main>

            <footer className="footer">
                <a className="brand" href="#home">
                    <span className="brand-icon"><Layers3 size={17} /></span>
                    <span>Port<span className="brand-dot">G</span>en</span>
                </a>
                <span>"Have patience with all things, but first of all with yourself."</span>
                <a href="#templates">Explore the templates <ArrowRight size={14} /></a>
            </footer>
        </div>
    );
}

export default HomePage;
