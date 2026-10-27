import { useEffect, useRef, useState } from "react";
import { getInterviewPreparation, saveInterviewPreparation } from "../../services/interviewService";
import catalog from "../../data/interviewPreparation.json" with { type: "json" };
import "./InterviewPreparation.css";

const categories = [...new Set(catalog.map(question => question.category))];
const defaults = { search: "", category: "all", difficulty: "all", status: "all", sort: "category", page: 1, limit: 12 };
const emptyDraft = { answer: "", notes: "", revisionStatus: "not-needed" };
const date = value => value ? new Date(value).toLocaleString() : "Not practiced yet";

export default function InterviewPreparation({ onDirtyChange } = {}) {
    const [filters, setFilters] = useState(defaults);
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [selected, setSelected] = useState(null);
    const [draft, setDraft] = useState(emptyDraft);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [success, setSuccess] = useState("");
    const generation = useRef(0);
    const saveLock = useRef(false);
    const detail = useRef(null);
    const queryKey = JSON.stringify(filters);
    const overview = data?.overview;
    const dirty = selected && (draft.answer !== selected.personal.answer || draft.notes !== selected.personal.notes || draft.revisionStatus !== selected.personal.revisionStatus);
    useEffect(() => { onDirtyChange?.(Boolean(dirty)); }, [Boolean(dirty), onDirtyChange]);

    const load = async signal => {
        const request = ++generation.current;
        setLoading(true);
        try {
            const response = await getInterviewPreparation(filters, signal);
            if (response?.success !== true || !Array.isArray(response.data?.questions) || !Array.isArray(response.data?.overview?.categories) || !response.data?.pagination) throw new Error("Invalid interview preparation response.");
            if (signal?.aborted || request !== generation.current) return false;
            setData(response.data);
            setSelected(previous => previous ? response.data.questions.find(question => question.id === previous.id) || previous : response.data.questions[0] || null);
            setLoadError("");
            return true;
        } catch (error) {
            if (signal?.aborted || request !== generation.current) return false;
            setLoadError(error?.message || "Could not load interview preparation.");
            return false;
        } finally {
            if (!signal?.aborted && request === generation.current) setLoading(false);
        }
    };
    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);
        return () => { controller.abort(); generation.current++; };
    }, [queryKey]);
    useEffect(() => {
        setDraft(selected ? { answer: selected.personal.answer, notes: selected.personal.notes, revisionStatus: selected.personal.revisionStatus } : emptyDraft);
        setSaveError("");
        setSuccess("");
    }, [selected?.id]);
    useEffect(() => {
        if (!dirty) return;
        const warn = event => { event.preventDefault(); event.returnValue = ""; };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const choose = question => {
        if (saving) return;
        if (question.id !== selected?.id && dirty && !window.confirm("Discard your unsaved answer and notes to open another question?")) return;
        setSelected(question);
        detail.current?.focus({ preventScroll: true });
    };
    const patch = async values => {
        if (!selected || saveLock.current) return;
        if ((values.answer?.length || 0) > 10000 || (values.notes?.length || 0) > 5000) { setSaveError("Keep your answer within 10,000 characters and notes within 5,000."); return; }
        const id = selected.id;
        saveLock.current = true;
        setSaving(true); setSaveError(""); setSuccess("");
        try {
            const response = await saveInterviewPreparation(id, values);
            if (response?.success !== true || response.data?.id !== id || !response.data?.personal) throw new Error("The server did not confirm this preparation update.");
            setSelected(previous => previous?.id === id ? response.data : previous);
            setSuccess("Saved to your account.");
            if (!await load()) setSuccess("Saved to your account, but the overview could not refresh. Retry loading; your save was confirmed.");
        } catch (error) {
            setSaveError(error?.message || "Could not save. Your draft is still available.");
        } finally { saveLock.current = false; setSaving(false); }
    };
    const changeFilter = event => setFilters(previous => ({ ...previous, [event.target.name]: event.target.value, page: 1 }));

    return <div className="interview-preparation">
        <header className="ip-header"><span className="ip-kicker">INTERVIEW PREPARATION</span><h1>Prepare with purpose</h1><p>Review questions, write your own answers, and keep a revision plan. Preparation progress is based on questions you mark practiced.</p></header>
        {loadError && <div className="ip-message" role="alert"><span>{loadError} Previously loaded totals may be out of date.</span><button type="button" disabled={loading || saving} onClick={() => load()}>Retry loading</button></div>}
        <section className="ip-overview" aria-label="Preparation overview">
            {[["Available questions", overview?.total], ["Questions practiced", overview?.practiced], ["Questions remaining", overview?.remaining], ["Preparation progress", overview ? `${Math.round(overview.percentage)}%` : null]].map(([label, value]) => <div className="ip-stat" key={label}><span>{label}</span><strong>{value ?? "—"}</strong></div>)}
        </section>
        <div className="ip-overview-details">
            <section className="ip-panel" aria-labelledby="ip-categories-title"><h2 id="ip-categories-title">Progress by category</h2><div className="ip-category-grid">{overview?.categories.map(item => <div className="ip-category" key={item.category}><div><span>{item.category}</span><strong>{item.practiced}/{item.total}</strong></div><progress max={100} value={item.percentage} aria-label={`${item.category} preparation progress`} /></div>)}</div></section>
            <section className="ip-panel" aria-labelledby="ip-recent-title"><h2 id="ip-recent-title">Recently practiced</h2>{!overview?.recent.length ? <p>Mark a question practiced to start your history.</p> : <ul className="ip-recent">{overview.recent.map(question => <li key={question.id}><button type="button" disabled={saving} onClick={() => choose(question)}>{question.question}</button><small>{date(question.personal.lastPracticedAt)}</small></li>)}</ul>}</section>
        </div>
        <section className="ip-panel" aria-label="Question filters"><form className="ip-filters" onSubmit={event => { event.preventDefault(); setFilters(previous => ({ ...previous, search: search.trim(), page: 1 })); }}>
            <label className="ip-search">Search questions<div><input type="search" value={search} maxLength={120} disabled={saving} onChange={event => setSearch(event.target.value)} placeholder="Search a topic or question" /><button disabled={saving} type="submit">Search</button></div></label>
            <label>Category<select name="category" value={filters.category} disabled={saving} onChange={changeFilter}><option value="all">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
            <label>Difficulty<select name="difficulty" value={filters.difficulty} disabled={saving} onChange={changeFilter}><option value="all">All levels</option>{["Easy", "Medium", "Hard"].map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Status<select name="status" value={filters.status} disabled={saving} onChange={changeFilter}><option value="all">All questions</option><option value="unpracticed">Not practiced</option><option value="practiced">Practiced</option><option value="bookmarked">Bookmarked</option><option value="revision">Needs revision</option></select></label>
            <label>Sort by<select name="sort" value={filters.sort} disabled={saving} onChange={changeFilter}><option value="category">Category order</option><option value="name">Question</option><option value="difficulty">Difficulty</option><option value="recent">Recently practiced</option></select></label>
        </form></section>
        <div className="ip-workspace">
            <section className="ip-panel" aria-labelledby="ip-bank-title" aria-busy={loading}><div className="ip-section-heading"><h2 id="ip-bank-title">Question bank</h2><span>{data?.pagination.total ?? "—"} matching</span></div>
                {loading ? <p role="status">Loading questions…</p> : !data?.questions.length ? <div className="ip-empty"><h3>{loadError ? "Questions unavailable" : "No matching questions"}</h3><p>{loadError ? "Retry loading above." : "Try another search or reset the filters."}</p>{!loadError && <button type="button" onClick={() => { setSearch(""); setFilters(defaults); }}>Reset filters</button>}</div> : <ul className="ip-question-list">{data.questions.map(question => <li key={question.id}><button type="button" className={selected?.id === question.id ? "selected" : ""} aria-pressed={selected?.id === question.id} disabled={saving} onClick={() => choose(question)}><span className="ip-question-meta">{question.category} · {question.difficulty}</span><strong>{question.question}</strong><span>{question.personal.practiced ? "Practiced" : "Not practiced"}{question.personal.bookmarked ? " · Bookmarked" : ""}{question.personal.revisionStatus === "needs-revision" ? " · Needs revision" : ""}</span></button></li>)}</ul>}
                {data && <nav className="ip-pagination" aria-label="Question pages"><button type="button" disabled={loading || saving || filters.page <= 1} onClick={() => setFilters(previous => ({ ...previous, page: previous.page - 1 }))}>Previous</button><span>Page {filters.page} of {Math.max(1, data.pagination.pages)}</span><button type="button" disabled={loading || saving || filters.page >= data.pagination.pages} onClick={() => setFilters(previous => ({ ...previous, page: previous.page + 1 }))}>Next</button></nav>}
            </section>
            <section className="ip-panel ip-practice" ref={detail} tabIndex={-1} aria-labelledby="ip-practice-title" aria-busy={saving}>
                {!selected ? <><h2 id="ip-practice-title">Your practice space</h2><p>Select a question to review guidance and write your answer.</p></> : <>
                    <span className="ip-kicker">{selected.category} · {selected.difficulty}</span><h2 id="ip-practice-title">{selected.question}</h2><p>Last practiced: {date(selected.personal.lastPracticedAt)}</p>
                    <div className="ip-actions"><button type="button" disabled={saving} aria-pressed={selected.personal.practiced} onClick={() => patch({ practiced: !selected.personal.practiced })}>{selected.personal.practiced ? "Mark not practiced" : "Mark practiced"}</button><button type="button" className="ip-secondary" disabled={saving} aria-pressed={selected.personal.bookmarked} onClick={() => patch({ bookmarked: !selected.personal.bookmarked })}>{selected.personal.bookmarked ? "Remove bookmark" : "Bookmark question"}</button></div>
                    <details className="ip-guidance"><summary>Review answer guidance</summary><p>{selected.guidance}</p><small>Guidance is a study aid, not an evaluation of your answer.</small></details>
                    <form onSubmit={event => { event.preventDefault(); patch(draft); }}>
                        <label htmlFor="ip-answer">Your answer<textarea id="ip-answer" rows={8} maxLength={10000} disabled={saving} value={draft.answer} onChange={event => setDraft(previous => ({ ...previous, answer: event.target.value }))} placeholder="Explain the concept in your own words…" /></label><small>{draft.answer.length}/10,000 characters</small>
                        <label htmlFor="ip-notes">Personal notes<textarea id="ip-notes" rows={4} maxLength={5000} disabled={saving} value={draft.notes} onChange={event => setDraft(previous => ({ ...previous, notes: event.target.value }))} placeholder="Examples, gaps, and reminders for your next revision" /></label><small>{draft.notes.length}/5,000 characters</small>
                        <label htmlFor="ip-revision">Revision status<select id="ip-revision" disabled={saving} value={draft.revisionStatus} onChange={event => setDraft(previous => ({ ...previous, revisionStatus: event.target.value }))}><option value="not-needed">No revision flagged</option><option value="needs-revision">Needs revision</option><option value="revised">Revised</option></select></label>
                        <div className="ip-save-row"><span>{dirty ? "Unsaved changes" : "No unsaved changes"}</span><button type="submit" disabled={saving || !dirty}>{saving ? "Saving…" : "Save answer & notes"}</button></div>
                    </form>
                    {saving && <p role="status">Saving your preparation…</p>}{saveError && <p className="ip-message" role="alert">{saveError}</p>}{success && <p role="status">{success}</p>}
                </>}
            </section>
        </div>
    </div>;
}
