
import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { requireAuthenticatedUser } from '../lib/auth';

const emptyPortfolio = {
    full_name: '',
    email: '',
    contact_number: '',
    address: '',
    about_me: '',
    profile_picture_url: '',
    education: [],
    skills: [],
    projects: [],
    work_experience: [],
    social_links: [],
    template: 'simple',
    is_published: false,
};

const sections = [
    {
        key: 'education',
        title: 'Education',
        fields: [
            ['school', 'School / Institution'],
            ['degree', 'Degree / Program'],
            ['year', 'Year / Period'],
            ['details', 'Details'],
        ],
    },
    {
        key: 'projects',
        title: 'Projects',
        fields: [
            ['name', 'Project name'],
            ['description', 'Description'],
            ['link', 'Project URL'],
            ['technologies', 'Technologies used'],
        ],
    },
    {
        key: 'work_experience',
        title: 'Work experience',
        fields: [
            ['position', 'Position'],
            ['company', 'Company'],
            ['period', 'Employment period'],
            ['description', 'Description'],
        ],
    },
    {
        key: 'social_links',
        title: 'Social links',
        fields: [
            ['platform', 'Platform'],
            ['url', 'Profile URL'],
        ],
    },
];

function isValidUrl(value) {
    if (!value.trim()) return true;

    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function PortfolioLivePreview({ form, skillsText, imagePreview }) {
    const skills = skillsText.split(',').map(skill => skill.trim()).filter(Boolean);

    return (
        <section className={`editor-live-preview public-portfolio public-${form.template || 'simple'}`} aria-live="polite">
            <div className="editor-preview-heading">
                <div><p className="eyebrow">LIVE PREVIEW</p><h2>Your portfolio updates as you type</h2></div>
                <span className="editor-preview-template">{({ simple: 'Simple', modern: 'Modern', creative: 'Creative' })[form.template] || 'Simple'} template</span>
            </div>
            <div className="editor-preview-canvas">
                <header className="public-hero editor-preview-hero">
                    {imagePreview ? <img className="public-avatar" src={imagePreview} alt="Profile preview" /> : <div className="public-avatar public-avatar-placeholder">{(form.full_name || '?').charAt(0).toUpperCase()}</div>}
                    <p className="public-kicker">PORTFOLIO</p>
                    <h1>{form.full_name || 'Your name'}</h1>
                    {form.about_me && <p className="public-about">{form.about_me}</p>}
                    <div className="public-contact">
                        {form.email && <span>{form.email}</span>}
                        {form.contact_number && <span>{form.contact_number}</span>}
                        {form.address && <span>{form.address}</span>}
                    </div>
                </header>
                {skills.length > 0 && <section className="public-section"><h2>Skills</h2><div className="public-skills">{skills.map((skill, i) => <span key={`${skill}-${i}`}>{skill}</span>)}</div></section>}
                {form.projects.some(item => item.name || item.description) && <section className="public-section"><h2>Selected projects</h2><div className="public-cards">{form.projects.filter(item => item.name || item.description).map((item, i) => <article className="public-card" key={`${item.name}-${i}`}><h3>{item.name || 'Project'}</h3>{item.description && <p>{item.description}</p>}{item.technologies && <p className="public-muted">{item.technologies}</p>}</article>)}</div></section>}
                {form.work_experience.some(item => item.position || item.company || item.description) && <section className="public-section"><h2>Experience</h2>{form.work_experience.filter(item => item.position || item.company || item.description).map((item, i) => <article className="public-timeline" key={`${item.position}-${i}`}><h3>{item.position || 'Experience'}{item.company ? ` · ${item.company}` : ''}</h3>{item.period && <p className="public-muted">{item.period}</p>}{item.description && <p>{item.description}</p>}</article>)}</section>}
                {form.education.some(item => item.school || item.degree || item.details) && <section className="public-section"><h2>Education</h2>{form.education.filter(item => item.school || item.degree || item.details).map((item, i) => <article className="public-timeline" key={`${item.school}-${i}`}><h3>{item.school || 'Education'}</h3>{item.degree && <p>{item.degree}</p>}{item.year && <p className="public-muted">{item.year}</p>}{item.details && <p>{item.details}</p>}</article>)}</section>}
                <footer className="public-footer">Made with <strong>PortGen</strong></footer>
            </div>
        </section>
    );
}

export default function PortfolioEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedTemplate = ['simple', 'modern', 'creative'].includes(searchParams.get('template'))
        ? searchParams.get('template')
        : 'simple';

    const [form, setForm] = useState(() => ({ ...emptyPortfolio, template: requestedTemplate }));
    const [skillsText, setSkillsText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(Boolean(id));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ full_name: '', contact_number: '' });

    useEffect(() => {
        let active = true;

        async function loadPortfolio() {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                await requireAuthenticatedUser();

                const { data, error: fetchError } = await supabase
                    .from('portfolios')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;

                if (!active) return;

                setForm({ ...emptyPortfolio, ...data });
                setSkillsText(
                    Array.isArray(data.skills) ? data.skills.join(', ') : ''
                );
                setImagePreview(data.profile_picture_url || '');
            } catch {
                if (active) {
                    setError(
                        'Unable to load this portfolio. It may not exist or may belong to another session.'
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadPortfolio();

        return () => {
            active = false;
        };
    }, [id]);

    function updateField(field, value) {
        setForm(previous => ({ ...previous, [field]: value }));
    }

    // Names may contain letters (including accented letters), spaces, apostrophes,
    // periods, and hyphens. Numbers and other symbols are not accepted.
    function handleFullNameChange(value) {
        const cleaned = value.replace(/[^\p{L}\p{M}\s'.’\-]/gu, '');
        updateField('full_name', cleaned);

        setFieldErrors(previous => ({
            ...previous,
            full_name: cleaned !== value
                ? 'Full name can contain letters, spaces, apostrophes, periods, and hyphens only.'
                : (cleaned.trim() && !/^[\p{L}\p{M}]+(?:[ '\u2019.-][\p{L}\p{M}.]+)*$/u.test(cleaned.trim())
                    ? 'Please enter a valid name using letters only.'
                    : ''),
        }));
    }

    function handleContactNumberChange(value) {
        const cleaned = value.replace(/\D/g, '');
        updateField('contact_number', cleaned);

        setFieldErrors(previous => ({
            ...previous,
            contact_number: cleaned !== value
                ? 'Contact number can contain numbers (0–9) only.'
                : (cleaned && (cleaned.length < 7 || cleaned.length > 15)
                    ? 'Enter a contact number with 7 to 15 digits.'
                    : ''),
        }));
    }

    function updateItem(section, index, field, value) {
        setForm(previous => ({
            ...previous,
            [section]: previous[section].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    }

    function addItem(section, fields) {
        const item = Object.fromEntries(fields.map(([key]) => [key, '']));

        setForm(previous => ({
            ...previous,
            [section]: [...previous[section], item],
        }));
    }

    function removeItem(section, index) {
        setForm(previous => ({
            ...previous,
            [section]: previous[section].filter((_, i) => i !== index),
        }));
    }

    function handleImageChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            setError('Choose a JPG, PNG, or WebP image.');
            event.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Your profile image must be 2 MB or smaller.');
            event.target.value = '';
            return;
        }

        setError('');
        setImageFile(file);
        setRemoveImage(false);
        setImagePreview(URL.createObjectURL(file));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setMessage('');

        const name = form.full_name.trim();
        const email = form.email.trim();
        const nextFieldErrors = { full_name: '', contact_number: '' };

        if (!name) {
            nextFieldErrors.full_name = 'Please enter your full name.';
        } else if (name.length > 150) {
            nextFieldErrors.full_name = 'Your name must be 150 characters or fewer.';
        } else if (!/^[\p{L}\p{M}]+(?:[ '\u2019.-][\p{L}\p{M}.]+)*$/u.test(name)) {
            nextFieldErrors.full_name = 'Use letters, spaces, apostrophes, periods, or hyphens only.';
        }

        const contactNumber = form.contact_number.trim();
        if (contactNumber && !/^\d{7,15}$/.test(contactNumber)) {
            nextFieldErrors.contact_number = 'Contact number must contain only 7 to 15 digits.';
        }

        setFieldErrors(nextFieldErrors);
        if (nextFieldErrors.full_name || nextFieldErrors.contact_number) {
            setError('Please correct the highlighted fields before saving.');
            return;
        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            setError('Please enter a valid email address.');
            return;
        }

        const urls = [
            ...form.projects.map(item => item.link),
            ...form.social_links.map(item => item.url),
        ];

        if (urls.some(url => !isValidUrl(url || ''))) {
            setError('Project and social links must be valid HTTP or HTTPS URLs.');
            return;
        }

        setSaving(true);
        let newlyUploadedPath = null;

        try {
            const user = await requireAuthenticatedUser();

            const oldImageUrl = form.profile_picture_url || '';
            let imageUrl = removeImage ? null : oldImageUrl;

            if (imageFile) {
                const extension = imageFile.name.split('.').pop()?.toLowerCase();
                const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
                    ? extension
                    : 'webp';

                newlyUploadedPath =
                    `${user.id}/${crypto.randomUUID()}.${safeExtension}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile-images')
                    .upload(newlyUploadedPath, imageFile, {
                        contentType: imageFile.type,
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('profile-images')
                    .getPublicUrl(newlyUploadedPath);

                imageUrl = publicData.publicUrl;
            }

            const payload = {
                full_name: name,
                email,
                contact_number: form.contact_number.trim(),
                address: form.address.trim(),
                about_me: form.about_me.trim(),
                profile_picture_url: imageUrl,
                education: form.education,
                skills: skillsText
                    .split(',')
                    .map(skill => skill.trim())
                    .filter(Boolean),
                projects: form.projects,
                work_experience: form.work_experience,
                social_links: form.social_links,
                template: form.template,
                is_published: Boolean(form.is_published),
            };

            let saved;

            if (id) {
                const { data, error: updateError } = await supabase
                    .from('portfolios')
                    .update(payload)
                    .eq('id', id)
                    .select('id')
                    .single();

                if (updateError) throw updateError;
                saved = data;
            } else {
                const { data, error: insertError } = await supabase
                    .from('portfolios')
                    .insert(payload)
                    .select('id')
                    .single();

                if (insertError) throw insertError;
                saved = data;
            }

            // Delete the previous image only after the database save succeeds.
            if (
                oldImageUrl &&
                (imageFile || removeImage) &&
                oldImageUrl.includes('/storage/v1/object/public/profile-images/')
            ) {
                const oldPath = decodeURIComponent(
                    oldImageUrl.split('/storage/v1/object/public/profile-images/')[1]
                        .split('?')[0]
                );

                if (oldPath && !oldPath.includes('..')) {
                    const { error: deleteError } = await supabase.storage
                        .from('profile-images')
                        .remove([oldPath]);

                    if (deleteError) {
                        console.warn('The old image could not be removed:', deleteError.message);
                    }
                }
            }

            setMessage('Portfolio saved successfully.');
            navigate('/manage', {
                replace: true,
                state: { savedId: saved.id },
            });
        } catch (err) {
            // Avoid leaving an uploaded orphan if saving the record failed.
            if (newlyUploadedPath) {
                await supabase.storage
                    .from('profile-images')
                    .remove([newlyUploadedPath]);
            }

            setError(err.message || 'Unable to save your portfolio.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <main className="page-container"><p>Loading portfolio...</p></main>;
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">YOUR WORKSPACE</p>
                    <h1>{id ? 'Edit portfolio' : 'New portfolio'}</h1>
                    <p>Enter your information and save it securely to your account.</p>
                </div>
                <Link to="/manage" className="button button-secondary">
                    Back to portfolios
                </Link>
            </div>

            {error && <div className="notice notice-error" role="alert">{error}</div>}
            {message && <div className="notice notice-success" role="status">{message}</div>}

            <PortfolioLivePreview form={form} skillsText={skillsText} imagePreview={imagePreview} />

            <form className="portfolio-form" onSubmit={handleSubmit}>
                <section className="form-card">
                    <h2>Personal information</h2>

                    <label>
                        Full name *
                        <input
                            value={form.full_name}
                            maxLength={150}
                            autoComplete="name"
                            aria-invalid={Boolean(fieldErrors.full_name)}
                            aria-describedby={fieldErrors.full_name ? 'full-name-error' : undefined}
                            onChange={e => handleFullNameChange(e.target.value)}
                            onBlur={() => {
                                const name = form.full_name.trim();
                                setFieldErrors(previous => ({
                                    ...previous,
                                    full_name: !name
                                        ? 'Please enter your full name.'
                                        : !/^[\p{L}\p{M}]+(?:[ '\u2019.-][\p{L}\p{M}.]+)*$/u.test(name)
                                            ? 'Use letters, spaces, apostrophes, periods, or hyphens only.'
                                            : '',
                                }));
                            }}
                            required
                        />
                        {fieldErrors.full_name && <span id="full-name-error" className="field-error" style={{ color: "#b42318", fontSize: "0.9rem", display: "block", marginTop: "0.35rem" }} role="alert">{fieldErrors.full_name}</span>}
                    </label>

                    <div className="form-grid">
                        <label>
                            Email address
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => updateField('email', e.target.value)}
                            />
                        </label>

                        <label>
                            Contact number
                            <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={form.contact_number}
                                maxLength={15}
                                placeholder="Digits only"
                                aria-invalid={Boolean(fieldErrors.contact_number)}
                                aria-describedby={fieldErrors.contact_number ? 'contact-number-error' : undefined}
                                onChange={e => handleContactNumberChange(e.target.value)}
                                onBlur={() => {
                                    const number = form.contact_number.trim();
                                    setFieldErrors(previous => ({
                                        ...previous,
                                        contact_number: number && !/^\d{7,15}$/.test(number)
                                            ? 'Enter a contact number with 7 to 15 digits.'
                                            : '',
                                    }));
                                }}
                            />
                            {fieldErrors.contact_number && <span id="contact-number-error" className="field-error" style={{ color: "#b42318", fontSize: "0.9rem", display: "block", marginTop: "0.35rem" }} role="alert">{fieldErrors.contact_number}</span>}
                        </label>
                    </div>

                    <label>
                        Address or location
                        <input
                            value={form.address}
                            onChange={e => updateField('address', e.target.value)}
                        />
                    </label>

                    <label>
                        About me
                        <textarea
                            rows={5}
                            value={form.about_me}
                            onChange={e => updateField('about_me', e.target.value)}
                            placeholder="Introduce yourself, your interests, and your goals."
                        />
                    </label>

                    <div className="image-field">
                        <label>
                            Profile picture (JPG, PNG, or WebP; maximum 2 MB)
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                            />
                        </label>

                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Profile preview" />
                                <button
                                    type="button"
                                    className="button button-secondary"
                                    onClick={() => {
                                        setImageFile(null);
                                        setRemoveImage(true);
                                        setImagePreview('');
                                    }}
                                >
                                    Remove picture
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {sections.map(section => (
                    <Fragment key={section.key}>
                        <section className="form-card">
                            <div className="section-heading">
                                <h2>{section.title}</h2>
                                <button
                                    type="button"
                                    className="button button-secondary"
                                    onClick={() => addItem(section.key, section.fields)}
                                >
                                    + Add {section.title.replace(/s$/, '')}
                                </button>
                            </div>

                            {form[section.key].length === 0 && (
                                <p className="muted">Nothing added yet. You can add this later.</p>
                            )}

                            {form[section.key].map((item, index) => (
                                <div className="repeat-item" key={`${section.key}-${index}`}>
                                    {section.fields.map(([field, label]) => (
                                        <label key={field}>
                                            {label}
                                            {field === 'description' || field === 'details' ? (
                                                <textarea
                                                    rows={3}
                                                    value={item[field] || ''}
                                                    onChange={e =>
                                                        updateItem(section.key, index, field, e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <input
                                                    value={item[field] || ''}
                                                    onChange={e =>
                                                        updateItem(section.key, index, field, e.target.value)
                                                    }
                                                />
                                            )}
                                        </label>
                                    ))}

                                    <button
                                        type="button"
                                        className="text-danger"
                                        onClick={() => removeItem(section.key, index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </section>
                        {section.key === 'work_experience' && (
                            <PortfolioLivePreview form={form} skillsText={skillsText} imagePreview={imagePreview} />
                        )}
                    </Fragment>
                ))}

                <section className="form-card">
                    <h2>Skills</h2>
                    <label>
                        Your skills, separated by commas
                        <textarea
                            rows={3}
                            value={skillsText}
                            onChange={e => setSkillsText(e.target.value)}
                            placeholder="HTML, CSS, JavaScript, Communication"
                        />
                    </label>
                </section>


                <section className="form-card">
                    <h2>Choose a template</h2>
                    <div className="template-options">
                        {[
                            ['simple', 'Simple', 'Clean and professional'],
                            ['modern', 'Modern', 'Bold and structured'],
                            ['creative', 'Creative', 'Expressive and colorful'],
                        ].map(([value, title, description]) => (
                            <label
                                key={value}
                                className={`template-option ${form.template === value ? 'selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="template"
                                    value={value}
                                    checked={form.template === value}
                                    onChange={e => updateField('template', e.target.value)}
                                />
                                <span className={`template-option-preview preview-${value}`} aria-hidden="true"><i /><i /><i /></span>
                                <span className="template-option-copy"><strong>{title}</strong><span>{description}</span></span>
                            </label>
                        ))}
                    </div>
                </section>

                <section className="form-card publish-card">
                    <h2>Publishing</h2>
                    <label className="publish-toggle">
                        <input
                            type="checkbox"
                            checked={Boolean(form.is_published)}
                            onChange={e => updateField('is_published', e.target.checked)}
                        />
                        <span>Make this portfolio public</span>
                    </label>
                    <p className="field-help">When published, anyone with the share link can view this portfolio. Your editing and deletion permissions remain private.</p>
                </section>

                <PortfolioLivePreview form={form} skillsText={skillsText} imagePreview={imagePreview} />

                <div className="form-actions">
                    <Link to="/manage" className="button button-secondary">Cancel</Link>
                    <button className="button button-primary" type="submit" disabled={saving}>
                        {saving ? 'Saving...' : id ? 'Save changes' : 'Save portfolio'}
                    </button>
                </div>
            </form>
        </main>
    );
}
