"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Check, ChevronRight, Cloud, Code2, Database, Folder, Globe2, Grid2X2, HardDrive, Heart, Home, LayoutGrid, List, Menu, MoreHorizontal, Network, Pencil, Play, Plus, Search, Server, Shield, Sparkles, Star, Trash2, X } from "lucide-react";
import { COLORS, ICONS, STORAGE_KEY, newId, normalizeUrl, parseShortcuts, type Shortcut } from "../lib/shortcuts";

const iconMap = { globe: Globe2, server: Server, database: Database, media: Play, code: Code2, cloud: Cloud, shield: Shield, home: Home };
const blank = { name: "", url: "", category: "General", color: "mint" as Shortcut["color"], icon: "globe" as Shortcut["icon"], favorite: false };

export default function Hub() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [sidebar, setSidebar] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Shortcut | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const formDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const importDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Shortcut[]>([]);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setShortcuts(parseShortcuts(JSON.parse(saved))); }
    catch { setStorageBlocked(true); setStorageError("Saved shortcuts could not be loaded. Your existing browser data has been preserved. Export any new links before closing this page."); }
    setReady(true);
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); searchInput.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts)); setStorageError(""); }
    catch { setStorageError("Browser storage is unavailable or full. Export your shortcuts to keep a backup before closing this page."); }
  }, [shortcuts, ready, storageBlocked]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(timer); }, [notice]);

  const categories = Array.from(new Set(shortcuts.map(s => s.category))).sort();
  const favorites = shortcuts.filter(s => s.favorite).length;
  const visible = shortcuts.filter(s => (filter === "all" || (filter === "favorites" ? s.favorite : s.category === filter.slice(4))) && `${s.name} ${s.url} ${s.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
  const title = filter === "all" ? "All shortcuts" : filter === "favorites" ? "Favorites" : filter.slice(4);

  function openForm(shortcut?: Shortcut) {
    setEditing(shortcut?.id ?? null); setDraft(shortcut ? { ...shortcut } : { ...blank, category: filter.startsWith("cat:") ? filter.slice(4) : "General" }); setFormError(""); formDialog.current?.showModal();
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!draft.name.trim()) throw new Error("Give your shortcut a name.");
      const item = { ...draft, name: draft.name.trim(), url: normalizeUrl(draft.url), category: draft.category.trim() || "General" };
      if (!editing && shortcuts.length >= 500) throw new Error("The hub supports up to 500 shortcuts.");
      setShortcuts(current => editing ? current.map(s => s.id === editing ? { ...s, ...item } : s) : [...current, { ...item, id: newId(), createdAt: Date.now() }]);
      setFilter("all"); setQuery(""); formDialog.current?.close(); setNotice(editing ? "Shortcut updated" : "Shortcut added to your hub");
    } catch (error) { setFormError(error instanceof Error ? error.message : "Check the website URL and try again."); }
  }
  function toggleFavorite(id: string) { setShortcuts(current => current.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s)); }
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, shortcuts }, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `homelabshub-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("Backup exported");
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Choose a JSON backup smaller than 2 MB.");
      const data = JSON.parse(await file.text()); const items = parseShortcuts(Array.isArray(data) ? data : data.shortcuts);
      if (shortcuts.length + items.length > 500) throw new Error("Import would exceed the limit of 500 shortcuts.");
      setPendingImport(items); importDialog.current?.showModal();
    } catch (error) { setNotice(error instanceof Error ? error.message : "This backup could not be imported."); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  }
  function navigate(value: string) { setFilter(value); setSidebar(false); }

  return <div className="app-shell">
    {sidebar && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebar(false)} />}
    <aside className={`sidebar ${sidebar ? "is-open" : ""}`}>
      <a className="brand" href="/" aria-label="Homelabs Hub home"><span className="brand-symbol"><Network size={23}/></span><span>homelabs<span className="brand-hub">hub</span><small>YOUR PERSONAL LAUNCHPAD</small></span></a>
      <div className="workspace-label"><span className="lab-avatar"><Home size={17}/></span><div>My homelab<small>Personal workspace</small></div><span className="tiny-dot"/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={`nav-item ${filter === "all" ? "active" : ""}`} onClick={() => navigate("all")}><LayoutGrid size={18}/>All shortcuts<span className="nav-count">{shortcuts.length}</span></button>
        <button className={`nav-item ${filter === "favorites" ? "active" : ""}`} onClick={() => navigate("favorites")}><Star size={18}/>Favorites<span className="nav-count">{favorites}</span></button>
      </nav>
      <div className="nav-label categories-label">CATEGORIES<span>{categories.length.toString().padStart(2,"0")}</span></div>
      <nav className="category-nav" aria-label="Categories">{categories.length ? categories.map(category => <button key={category} className={`nav-item ${filter === `cat:${category}` ? "active" : ""}`} onClick={() => navigate(`cat:${category}`)}><Folder size={17}/><span className="truncate">{category}</span><span className="nav-count">{shortcuts.filter(s => s.category === category).length}</span></button>) : <p className="category-hint">Your categories will appear here as you add shortcuts.</p>}</nav>
      <div className="sidebar-bottom"><div className="backup-card"><HardDrive size={19}/><strong>Make yourself at home.</strong><p>Your links stay in this browser.<br/>Keep a backup for peace of mind.</p><button onClick={exportData} disabled={!ready}><ArrowDownToLine size={14}/>Export shortcuts</button></div><div className="sidebar-footer"><span className="tiny-dot"/>Local workspace<span>v1.0</span></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setSidebar(true)} aria-label="Open navigation"><Menu size={20}/></button><Home size={15}/><span>Workspace</span><ChevronRight size={14}/><strong>{title}</strong></div><span className="private-badge"><Shield size={13}/>Private by default</span></header>
      <main>
        <section className="welcome"><div><div className="eyebrow"><span/> YOUR SPACE, CONNECTED</div><h1>Your lab. One launchpad<span>.</span></h1><p>All your self-hosted services, just one click away.</p></div><button className="primary-button" disabled={!ready} onClick={() => openForm()}><Plus size={18}/>Add shortcut</button></section>
        <section className="overview" aria-label="Workspace overview"><div><span className="stat-icon mint"><LayoutGrid size={20}/></span><div><span>Total shortcuts</span><strong>{shortcuts.length.toString().padStart(2,"0")}</strong></div><span className="stat-caption">In your workspace</span></div><div><span className="stat-icon amber"><Star size={20}/></span><div><span>Favorites</span><strong>{favorites.toString().padStart(2,"0")}</strong></div><span className="stat-caption">Your go-to services</span></div><div><span className="stat-icon purple"><Folder size={20}/></span><div><span>Categories</span><strong>{categories.length.toString().padStart(2,"0")}</strong></div><span className="stat-caption">Everything in its place</span></div></section>
        {storageError && <p className="error-banner" role="alert">{storageError}</p>}
        <section className="shortcuts-section"><div className="section-heading"><div><h2>{title}<span>{visible.length}</span></h2><p>{filter === "favorites" ? "The services you reach for most." : "A little less searching. A lot more doing."}</p></div><div className="transfer-actions"><button onClick={() => fileInput.current?.click()} disabled={!ready}><ArrowUpFromLine size={15}/>Import</button><button onClick={exportData} disabled={!ready}><ArrowDownToLine size={15}/>Export</button><input type="file" accept="application/json,.json" ref={fileInput} hidden onChange={event => importData(event.target.files?.[0])}/></div></div>
        <div className="toolbar"><label className="search-field"><Search size={18}/><input ref={searchInput} aria-label="Search shortcuts" placeholder="Search your shortcuts…" value={query} onChange={event => setQuery(event.target.value)}/>{query ? <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button> : <kbd>Ctrl K</kbd>}</label><div className="toolbar-right"><select aria-label="Sort shortcuts" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select><div className="view-toggle"><button className={view === "grid" ? "selected" : ""} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={17}/></button><button className={view === "list" ? "selected" : ""} aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={19}/></button></div></div></div>
        {!ready ? <div className="empty-state"><p>Loading your workspace…</p></div> : visible.length ? <div className={`shortcut-grid ${view === "list" ? "list-view" : ""}`}>{visible.map(s => { const Icon = iconMap[s.icon]; return <article className="shortcut-card" key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="shortcut-link" aria-label={`Open ${s.name} in a new tab`}><span className={`service-icon ${s.color}`}><Icon size={25}/></span><div className="shortcut-info"><span className="card-category">{s.category}</span><h3>{s.name}</h3><p>{s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p></div><ArrowUpRight className="launch-arrow" size={18}/></a><div className="card-footer"><span><span className="link-dot"/>Website shortcut</span><div><button className={`icon-button ${s.favorite ? "is-favorite" : ""}`} aria-label={`${s.favorite ? "Unfavorite" : "Favorite"} ${s.name}`} aria-pressed={s.favorite} onClick={() => toggleFavorite(s.id)}><Star size={16} fill={s.favorite ? "currentColor" : "none"}/></button><button className="icon-button" aria-label={`Edit ${s.name}`} onClick={() => openForm(s)}><Pencil size={15}/></button><button className="icon-button delete-button" aria-label={`Delete ${s.name}`} onClick={() => { setDeleting(s); deleteDialog.current?.showModal(); }}><Trash2 size={15}/></button></div></div></article>; })}<button className="add-card" onClick={() => openForm()}><span><Plus size={22}/></span><strong>Add a shortcut</strong><small>Give another service a home</small></button></div> : <div className="empty-state">{shortcuts.length === 0 && !query ? <><div className="empty-orbit"><span className="orbit-mini orbit-one"><Database size={18}/></span><span className="empty-main-icon"><Network size={35}/></span><span className="orbit-mini orbit-two"><Cloud size={19}/></span><span className="orbit-mini orbit-three"><Server size={18}/></span></div><span className="empty-kicker">A NEW HOME FOR YOUR HOMELAB</span><h3>Great things start with a shortcut.</h3><p>Your media server, NAS, dashboards, and side projects.<br/>Bring them together in a space that’s yours.</p><button className="primary-button" onClick={() => openForm()}><Plus size={17}/>Add your first shortcut</button><span className="empty-note">Just a name and a URL. That’s all you need.</span></> : <><Search size={30}/><h3>{filter === "favorites" && !query ? "Keep your favorites close." : "No shortcuts found."}</h3><p>{filter === "favorites" && !query ? "Click the star on any shortcut to find it here." : "Try a different search or add a shortcut to this space."}</p><button className="secondary-button" onClick={() => { setQuery(""); setFilter("all"); }}>Show all shortcuts</button></>}</div>}
        </section>
        <div className="bottom-note"><span><Sparkles size={15}/>Less tabs. More tinkering.</span><span>Built for your corner of the internet.</span></div>
      </main>
    </div>
    <dialog ref={formDialog} className="modal"><form onSubmit={save}><div className="modal-header"><span className="modal-icon mint"><Plus size={22}/></span><button type="button" className="icon-button" onClick={() => formDialog.current?.close()} aria-label="Close editor"><X size={20}/></button></div><h2>{editing ? "Edit shortcut" : "A new connection."}</h2><p className="modal-description">Give your service a name and a place in your hub.</p><label>Website name<input autoFocus required maxLength={80} placeholder="e.g. My media server" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>Website URL<input required maxLength={2048} placeholder="http://192.168.1.10:8096" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })}/><small>Local IPs, hostnames, and HTTPS websites are welcome.</small></label><label>Category<input list="category-options" maxLength={40} placeholder="e.g. Media, Infrastructure, Tools" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}/><datalist id="category-options">{Array.from(new Set(["General", "Infrastructure", "Media", "Storage", "Tools", ...categories])).map(c => <option key={c} value={c}/>)}</datalist></label><fieldset><legend>Choose an icon</legend><div className="icon-picker">{ICONS.map(icon => { const Icon = iconMap[icon]; return <button className={draft.icon === icon ? "chosen" : ""} type="button" key={icon} aria-label={`${icon} icon`} aria-pressed={draft.icon === icon} onClick={() => setDraft({ ...draft, icon })}><Icon size={20}/></button>; })}</div></fieldset><fieldset><legend>Accent color</legend><div className="color-picker">{COLORS.map(color => <button type="button" key={color} className={`color-swatch ${color}`} aria-label={`${color} accent`} aria-pressed={draft.color === color} onClick={() => setDraft({ ...draft, color })}>{draft.color === color && <Check size={17}/>}</button>)}</div></fieldset><label className="checkbox-label"><input type="checkbox" checked={draft.favorite} onChange={e => setDraft({ ...draft, favorite: e.target.checked })}/><Star size={16}/>Add to favorites</label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => formDialog.current?.close()}>Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Add shortcut"}<ArrowUpRight size={16}/></button></div></form></dialog>
    <dialog ref={deleteDialog} className="modal small-modal"><h2>Remove shortcut?</h2><p className="modal-description">“{deleting?.name}” will be removed from your hub.</p><div className="modal-actions"><button className="secondary-button" onClick={() => deleteDialog.current?.close()}>Cancel</button><button className="danger-button" onClick={() => { setShortcuts(s => s.filter(item => item.id !== deleting?.id)); deleteDialog.current?.close(); setNotice("Shortcut removed"); }}>Remove shortcut</button></div></dialog>
    <dialog ref={importDialog} className="modal small-modal"><h2>Import your shortcuts</h2><p className="modal-description">Add {pendingImport.length} shortcut{pendingImport.length === 1 ? "" : "s"} to your hub. Your existing shortcuts will be kept. Repeated names and URLs are skipped.</p><div className="modal-actions"><button className="secondary-button" onClick={() => importDialog.current?.close()}>Cancel</button><button className="primary-button" onClick={() => { setShortcuts(current => { const keys = new Set(current.map(s => `${s.name}\n${s.url}`)); const additions = pendingImport.filter(s => { const key = `${s.name}\n${s.url}`; if (keys.has(key)) return false; keys.add(key); return true; }); return [...current, ...additions.map(s => ({ ...s, id: newId() }))]; }); setFilter("all"); setQuery(""); importDialog.current?.close(); setNotice("Backup imported"); }}>Import shortcuts</button></div></dialog>
    {notice && <div className="toast" role="status"><Check size={17}/>{notice}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16}/></button></div>}
  </div>;
}
