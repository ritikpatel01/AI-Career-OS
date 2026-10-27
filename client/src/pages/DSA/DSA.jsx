import { useEffect, useRef, useState } from "react";
import { getDSA, createDSA, updateDSA } from "../../services/dsaService";
import { calculateDSAProgress, getCanonicalDSATopics, filterDSATopics, validateDSAForm } from "../../utils/dsaProgress.js";
import "./DSA.css";

const emptyForm = { difficulty: "easy", status: "not-started", problemsSolved: "0", notes: "" };
const statusLabels = { "not-started": "Not Started", "in-progress": "In Progress", completed: "Completed" };

function DSA() {
    const [records, setRecords] = useState([]);
    const [available, setAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selected, setSelected] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("roadmap");
    const version = useRef(0);
    const saveLock = useRef(false);
    const formRef = useRef(null);
    const topics = getCanonicalDSATopics(records);
    const selectedTopic = topics.find(item => item.topic === selected);
    const summary = available ? calculateDSAProgress(records) : null;
    const visibleTopics = filterDSATopics(topics, search, status, sort);
    const countValid = selectedTopic && !validateDSAForm(form, selectedTopic);

    const loadTopics = async signal => {
        const request = ++version.current;
        setRefreshing(true);
        try {
            const response = await getDSA({ signal });
            if (response?.success !== true || !Array.isArray(response?.data?.topics)) throw new Error("The DSA API returned an invalid topic list.");
            if (signal?.aborted || request !== version.current) return false;
            setRecords(response.data.topics);
            setAvailable(true);
            setError("");
            return true;
        } catch (failure) {
            if (signal?.aborted || request !== version.current) return false;
            setAvailable(false);
            setError(failure?.message || "Could not load DSA topics.");
            return false;
        } finally {
            if (!signal?.aborted && request === version.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        loadTopics(controller.signal);
        return () => { controller.abort(); version.current++; };
    }, []);

    const editTopic = item => {
        if (saving || !available) return;
        setSelected(item.topic);
        setForm({ difficulty: item.difficulty || "easy", status: item.status || "not-started", problemsSolved: String(item.problemsSolved ?? 0), notes: item.notes || "" });
        setError("");
        setSuccess("");
        formRef.current?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
        formRef.current?.focus({ preventScroll: true });
    };
    const changeForm = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
    const resetForm = () => { setSelected(""); setForm(emptyForm); setError(""); };
    const handleSubmit = async event => {
        event.preventDefault();
        if (saveLock.current || !available || refreshing) return;
        const validation = validateDSAForm(form, selectedTopic);
        if (validation) { setError(validation); return; }
        saveLock.current = true;
        setSaving(true);
        setSuccess("");
        setError("");
        try {
            const payload = { topic: selectedTopic.topic, category: selectedTopic.category, difficulty: form.difficulty, status: form.status, problemsSolved: Number(form.problemsSolved), notes: form.notes.trim() };
            const result = selectedTopic._id ? await updateDSA(selectedTopic._id, payload) : await createDSA(payload);
            if (result?.success !== true) throw new Error("The server did not confirm saving this topic.");
            setSuccess(`${selectedTopic.topic} saved successfully.`);
            if (await loadTopics()) { setSelected(""); setForm(emptyForm); }
            else setSuccess(`${selectedTopic.topic} was saved. Reload the topic list to confirm the latest totals; do not submit again.`);
        } catch (failure) {
            setError(failure?.message || "Could not save this topic. Your changes remain in the form.");
        } finally {
            saveLock.current = false;
            setSaving(false);
        }
    };

    if (loading) return <div className="dsa-page"><div className="dsa-loading" role="status">Loading DSA progress…</div></div>;

    return <div className="dsa-page">
        <header className="dsa-page-header">
            <div><span className="dsa-eyebrow">DSA PREPARATION</span><h1>DSA Progress</h1><p>Build a consistent problem-solving practice, one topic at a time.</p></div>
            <span className="dsa-header-icon" aria-hidden="true">🧠</span>
        </header>
        {error && <div className="dsa-message dsa-error" role="alert"><span>{error}</span>{!available && <button type="button" disabled={refreshing || saving} onClick={() => loadTopics()}>{refreshing ? "Loading…" : "Retry loading topics"}</button>}</div>}
        {success && <div className="dsa-message dsa-success" role="status">{success}</div>}

        <section className="dsa-panel dsa-summary" aria-labelledby="dsa-summary-title">
            <div className="dsa-summary-heading"><div><span className="dsa-kicker">YOUR PROGRESS</span><h2 id="dsa-summary-title">Average DSA Progress</h2><p>Problem-weighted progress across all 20 canonical topics.</p></div><strong className="dsa-summary-percentage" aria-live="polite">{summary ? `${summary.displayedPercentage}%` : "—"}</strong></div>
            <dl className="dsa-summary-stats" aria-live="polite"><div><dt>Problems solved</dt><dd>{summary?.solved ?? "—"}</dd></div><div><dt>Total problem target</dt><dd>{summary?.target ?? "—"}</dd></div><div><dt>Remaining problems</dt><dd>{summary?.remaining ?? "—"}</dd></div></dl>
            <div className="dsa-progress-bar" role="progressbar" aria-label="Average DSA progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary?.percentage} aria-valuetext={summary ? `${summary.solved} of ${summary.target} problems solved` : "Progress unavailable"}><div className="dsa-progress-fill" style={{ width: `${summary?.percentage ?? 0}%` }} /></div>
            {!summary && <p role="status">Progress is unavailable. Reload the topic records to see accurate totals.</p>}
        </section>

        <section className="dsa-panel dsa-form-card" aria-labelledby="dsa-form-title" ref={formRef} tabIndex={-1}>
            <div className="dsa-section-heading"><div><h2 id="dsa-form-title">Update DSA Topic</h2><p>{selectedTopic ? `Editing ${selectedTopic.topic}. Changes are saved only when you submit.` : "Choose Edit Topic on a card below to record your progress."}</p></div>{selectedTopic && <span className="dsa-selection-label">{selectedTopic.category}</span>}</div>
            <form onSubmit={handleSubmit} aria-busy={saving}>
                <fieldset disabled={!selectedTopic || saving || refreshing || !available}>
                    <legend className="dsa-sr-only">Topic progress details</legend>
                    <div className="dsa-form-grid">
                        <div className="dsa-field dsa-full-width"><label htmlFor="topic">Topic</label><input id="topic" value={selected || ""} readOnly placeholder="Select a topic below" /></div>
                        <div className="dsa-field"><label htmlFor="difficulty">Difficulty</label><select id="difficulty" name="difficulty" value={form.difficulty} onChange={changeForm}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
                        <div className="dsa-field"><label htmlFor="status">Study status</label><select id="status" name="status" value={form.status} onChange={changeForm}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                        <div className="dsa-field"><label htmlFor="problemsSolved">Problems solved</label><input id="problemsSolved" name="problemsSolved" type="number" min={0} max={selectedTopic?.problemTarget} step={1} required value={form.problemsSolved} onChange={changeForm} aria-describedby="dsa-count-help" aria-invalid={Boolean(selectedTopic && !countValid)} /><small id="dsa-count-help">{selectedTopic ? `Enter 0–${selectedTopic.problemTarget} whole problems. Target: ${selectedTopic.problemTarget}.` : "Select a topic to view its target."}</small></div>
                        <div className="dsa-field"><label htmlFor="category">Category</label><input id="category" value={selectedTopic?.category || ""} readOnly /></div>
                        <div className="dsa-field dsa-full-width"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={3} maxLength={2000} value={form.notes} onChange={changeForm} placeholder="What did you learn? What needs another attempt?" /><small>{form.notes.length}/2,000 characters</small></div>
                    </div>
                </fieldset>
                <div className="dsa-form-actions"><span>{saving ? "Saving and refreshing progress…" : "Study status is recorded separately from problem completion."}</span><div><button type="button" className="dsa-secondary-button" disabled={!selectedTopic || saving || refreshing} onClick={resetForm}>Cancel</button><button type="submit" className="dsa-primary-button" disabled={!selectedTopic || saving || refreshing || !available}>{saving ? "Saving…" : "Update DSA"}</button></div></div>
            </form>
        </section>

        <section className="dsa-topics-section" aria-labelledby="dsa-topics-title">
            <div className="dsa-section-heading"><div><h2 id="dsa-topics-title">Your learning topics</h2><p>One card per canonical topic. Counts are capped at each topic’s target.</p></div><span className="dsa-results-count" role="status">{visibleTopics.length} of {topics.length} topics</span></div>
            <div className="dsa-toolbar">
                <div className="dsa-field"><label htmlFor="dsa-search">Search topics</label><input id="dsa-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search topics, categories or notes" /></div>
                <div className="dsa-field"><label htmlFor="dsa-status-filter">Study status</label><select id="dsa-status-filter" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="dsa-field"><label htmlFor="dsa-sort">Sort by</label><select id="dsa-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="roadmap">Roadmap order</option><option value="name">Topic name</option><option value="progress-high">Most progress</option><option value="progress-low">Least progress</option></select></div>
            </div>
            {!available ? <div className="dsa-empty-state">Topic records are unavailable. Use Retry above to reload them.</div> : visibleTopics.length === 0 ? <div className="dsa-empty-state"><h3>No matching topics</h3><p>Try another search or study status.</p><button className="dsa-secondary-button" type="button" onClick={() => { setSearch(""); setStatus("all"); }}>Clear filters</button></div> : <div className="dsa-topics-grid">{visibleTopics.map(item => {
                const valid = Number.isFinite(item.problemsSolved) && item.problemsSolved >= 0 && Number.isFinite(item.problemTarget) && item.problemTarget > 0;
                const solved = valid ? Math.min(item.problemsSolved, item.problemTarget) : null;
                const percentage = valid ? solved / item.problemTarget * 100 : null;
                return <article className={`dsa-topic-card${selected === item.topic ? " is-editing" : ""}`} key={item.topic}>
                    <div className="dsa-topic-header"><div><span className="dsa-kicker">{item.category}</span><h3>{item.topic}</h3></div><span className={`dsa-difficulty ${item.difficulty}`}>{item.difficulty || "easy"}</span></div>
                    <span className={`dsa-status ${item.status}`}>{statusLabels[item.status] || "Unknown status"}</span>
                    <div className="dsa-topic-info"><span>Problems solved<strong>{valid ? `${solved} / ${item.problemTarget}` : "Unavailable"}</strong></span><strong>{valid ? `${Math.round(percentage)}%` : "—"}</strong></div>
                    <div className="dsa-progress-bar" role="progressbar" aria-label={`${item.topic} problem progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage ?? undefined}><div className="dsa-progress-fill" style={{ width: `${percentage ?? 0}%` }} /></div>
                    <p className="dsa-topic-remaining">{valid ? `${item.problemTarget - solved} problems remaining` : "Check the stored problem counts."}{!item._id && " · Not recorded yet"}</p>
                    {item.notes && <div className="dsa-topic-notes"><span>Notes</span><p>{item.notes}</p></div>}
                    <div className="dsa-topic-actions"><button type="button" className="dsa-secondary-button" disabled={saving || refreshing} onClick={() => editTopic(item)}>{selected === item.topic ? "Editing topic" : "Edit Topic"}</button></div>
                </article>;
            })}</div>}
        </section>
    </div>;
}

export default function DSADesktopCanvas() {
    return (
        <div className="dsa-desktop-scroll" role="region" aria-label="DSA page. Scroll horizontally to view all content on narrow screens." tabIndex={0}>
            <div className="dsa-desktop-canvas">
                <DSA />
            </div>
        </div>
    );
}
