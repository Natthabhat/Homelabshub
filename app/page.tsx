"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, ChevronRight, Cloud, Code2, Database, Folder, Globe2, Grid2X2, Home, LayoutGrid, List, Network, Pencil, Play, Plus, Search, Server, Shield, Sparkles, Star, Trash2, X } from "lucide-react";
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
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [draft, setDraft] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Shortcut | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const formDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setShortcuts(parseShortcuts(JSON.parse(saved))); const categories=JSON.parse(localStorage.getItem("homelabshub.categories.v1")||"[]"); if(!Array.isArray(categories)||categories.some(c=>typeof c!=="string"||!c.trim()||c.length>40)||categories.length>200)throw new Error("Invalid categories"); setSavedCategories(categories); }
    catch { setStorageBlocked(true); setStorageError("Saved shortcuts could not be loaded. Your existing browser data has been preserved. New links cannot be saved until browser storage is available."); }
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
    catch { setStorageError("Browser storage is unavailable or full. Changes may not persist after closing this page."); }
  }, [shortcuts, ready, storageBlocked]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(timer); }, [notice]);

  useEffect(()=>{if(!ready||storageBlocked)return;try{localStorage.setItem("homelabshub.categories.v1",JSON.stringify(savedCategories));}catch{setStorageError("Categories could not be saved in this browser.");}},[savedCategories,ready,storageBlocked]);
  const categories = Array.from(new Set([...savedCategories,...shortcuts.map(s => s.category)])).sort();
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
  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();const value=categoryName.trim();setCategoryError("");
    if(!value||value.length>40){setCategoryError("Enter a category name up to 40 characters.");return;}
    if(categories.some(c=>c.toLowerCase()===value.toLowerCase())){setCategoryError("That category already exists.");return;}
    if(categories.length>=200){setCategoryError("You can create up to 200 categories.");return;}
    setSavedCategories(current=>[...current,value]);setCategoryName("");setNotice("Category added");
  }

  return <div className="app-shell">
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><Network size={18}/><span>Homelabs Hub</span><ChevronRight size={14}/><strong>{title}</strong></div><span className="private-badge"><Shield size={13}/>Private by default</span></header>
      <main>
        <section className="welcome"><div><div className="eyebrow"><span/> YOUR SPACE, CONNECTED</div><h1>Your lab. One launchpad<span>.</span></h1><p>All your self-hosted services, just one click away.</p></div><button className="primary-button" disabled={!ready} onClick={() => openForm()}><Plus size={18}/>Add shortcut</button></section>
        <section className="overview" aria-label="Workspace overview"><div><span className="stat-icon mint"><LayoutGrid size={20}/></span><div><span>Total shortcuts</span><strong>{shortcuts.length.toString().padStart(2,"0")}</strong></div><span className="stat-caption">In your workspace</span></div><div><span className="stat-icon amber"><Star size={20}/></span><div><span>Favorites</span><strong>{favorites.toString().padStart(2,"0")}</strong></div><span className="stat-caption">Your go-to services</span></div><div><span className="stat-icon purple"><Folder size={20}/></span><div><span>Categories</span><strong>{categories.length.toString().padStart(2,"0")}</strong></div><span className="stat-caption">Everything in its place</span></div></section>
        {storageError && <p className="error-banner" role="alert">{storageError}</p>}
        <section className="category-manager" aria-label="Manage categories"><div><h2>Categories</h2><p>Create a category, then assign it when adding or editing a shortcut.</p></div><form onSubmit={addCategory}><input aria-label="New category name" placeholder="New category name" maxLength={40} required value={categoryName} disabled={!ready||storageBlocked} onChange={e=>setCategoryName(e.target.value)}/><button className="secondary-button" disabled={!ready||storageBlocked}><Plus size={16}/>Add category</button></form>{categoryError&&<p className="form-error" role="alert">{categoryError}</p>}</section>
        <nav className="category-tabs" aria-label="Filter shortcuts by category"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All shortcuts <span>{shortcuts.length}</span></button><button className={filter==='favorites'?'active':''} onClick={()=>setFilter('favorites')}><Star size={14}/>Favorites <span>{favorites}</span></button>{categories.map(c=><button key={c} className={filter===`cat:${c}`?'active':''} onClick={()=>setFilter(`cat:${c}`)}><Folder size={14}/>{c}<span>{shortcuts.filter(s=>s.category===c).length}</span></button>)}</nav>
        <section className="shortcuts-section"><div className="section-heading"><div><h2>{title}<span>{visible.length}</span></h2><p>{filter === "favorites" ? "The services you reach for most." : "A little less searching. A lot more doing."}</p></div></div>
        <div className="toolbar"><label className="search-field"><Search size={18}/><input ref={searchInput} aria-label="Search shortcuts" placeholder="Search your shortcuts…" value={query} onChange={event => setQuery(event.target.value)}/>{query ? <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button> : <kbd>Ctrl K</kbd>}</label><div className="toolbar-right"><select aria-label="Sort shortcuts" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select><div className="view-toggle"><button className={view === "grid" ? "selected" : ""} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={17}/></button><button className={view === "list" ? "selected" : ""} aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={19}/></button></div></div></div>
        {!ready ? <div className="empty-state"><p>Loading your workspace…</p></div> : (visible.length || (!query && filter!=="favorites" && categories.length>0)) ? <div className="category-groups">{categories.filter(category=>filter.startsWith('cat:')?category===filter.slice(4):(!query&&filter==='all')||visible.some(s=>s.category===category)).map(category=><section className="shortcut-category" key={category}><div className="category-heading"><h3><Folder size={18}/>{category}<span>{visible.filter(s=>s.category===category).length}</span></h3><button className="secondary-button" onClick={()=>{openForm();setDraft({...blank,category});}}><Plus size={14}/>Add shortcut</button></div><div className={`shortcut-grid ${view==='list'?'list-view':''}`}>{visible.filter(s=>s.category===category).map(s => { const Icon = iconMap[s.icon]; return <article className="shortcut-card" key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="shortcut-link" aria-label={`Open ${s.name} in a new tab`}><span className={`service-icon ${s.color}`}><Icon size={25}/></span><div className="shortcut-info"><span className="card-category">{s.category}</span><h3>{s.name}</h3><p>{s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p></div><ArrowUpRight className="launch-arrow" size={18}/></a><div className="card-footer"><span><span className="link-dot"/>Website shortcut</span><div><button className={`icon-button ${s.favorite ? "is-favorite" : ""}`} aria-label={`${s.favorite ? "Unfavorite" : "Favorite"} ${s.name}`} aria-pressed={s.favorite} onClick={() => toggleFavorite(s.id)}><Star size={16} fill={s.favorite ? "currentColor" : "none"}/></button><button className="icon-button" aria-label={`Edit ${s.name}`} onClick={() => openForm(s)}><Pencil size={15}/></button><button className="icon-button delete-button" aria-label={`Delete ${s.name}`} onClick={() => { setDeleting(s); deleteDialog.current?.showModal(); }}><Trash2 size={15}/></button></div></div></article>; })}</div>{!visible.some(s=>s.category===category)&&<p className="empty-category">No shortcuts in this category yet.</p>}</section>)}</div> : <div className="empty-state">{shortcuts.length === 0 && !query ? <><div className="empty-orbit"><span className="orbit-mini orbit-one"><Database size={18}/></span><span className="empty-main-icon"><Network size={35}/></span><span className="orbit-mini orbit-two"><Cloud size={19}/></span><span className="orbit-mini orbit-three"><Server size={18}/></span></div><span className="empty-kicker">A NEW HOME FOR YOUR HOMELAB</span><h3>Great things start with a shortcut.</h3><p>Your media server, NAS, dashboards, and side projects.<br/>Bring them together in a space that’s yours.</p><button className="primary-button" onClick={() => openForm()}><Plus size={17}/>Add your first shortcut</button><span className="empty-note">Just a name and a URL. That’s all you need.</span></> : <><Search size={30}/><h3>{filter === "favorites" && !query ? "Keep your favorites close." : "No shortcuts found."}</h3><p>{filter === "favorites" && !query ? "Click the star on any shortcut to find it here." : "Try a different search or add a shortcut to this space."}</p><button className="secondary-button" onClick={() => { setQuery(""); setFilter("all"); }}>Show all shortcuts</button></>}</div>}
        </section>
        <div className="bottom-note"><span><Sparkles size={15}/>Less tabs. More tinkering.</span><span>Built for your corner of the internet.</span></div>
      </main>
    </div>
    <dialog ref={formDialog} className="modal"><form onSubmit={save}><div className="modal-header"><span className="modal-icon mint"><Plus size={22}/></span><button type="button" className="icon-button" onClick={() => formDialog.current?.close()} aria-label="Close editor"><X size={20}/></button></div><h2>{editing ? "Edit shortcut" : "A new connection."}</h2><p className="modal-description">Give your service a name and a place in your hub.</p><label>Website name<input autoFocus required maxLength={80} placeholder="e.g. My media server" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>Website URL<input required maxLength={2048} placeholder="http://192.168.1.10:8096" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })}/><small>Local IPs, hostnames, and HTTPS websites are welcome.</small></label><label>Category<input list="category-options" maxLength={40} placeholder="e.g. Media, Infrastructure, Tools" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}/><datalist id="category-options">{Array.from(new Set(["General", "Infrastructure", "Media", "Storage", "Tools", ...categories])).map(c => <option key={c} value={c}/>)}</datalist></label><fieldset><legend>Choose an icon</legend><div className="icon-picker">{ICONS.map(icon => { const Icon = iconMap[icon]; return <button className={draft.icon === icon ? "chosen" : ""} type="button" key={icon} aria-label={`${icon} icon`} aria-pressed={draft.icon === icon} onClick={() => setDraft({ ...draft, icon })}><Icon size={20}/></button>; })}</div></fieldset><fieldset><legend>Accent color</legend><div className="color-picker">{COLORS.map(color => <button type="button" key={color} className={`color-swatch ${color}`} aria-label={`${color} accent`} aria-pressed={draft.color === color} onClick={() => setDraft({ ...draft, color })}>{draft.color === color && <Check size={17}/>}</button>)}</div></fieldset><label className="checkbox-label"><input type="checkbox" checked={draft.favorite} onChange={e => setDraft({ ...draft, favorite: e.target.checked })}/><Star size={16}/>Add to favorites</label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => formDialog.current?.close()}>Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Add shortcut"}<ArrowUpRight size={16}/></button></div></form></dialog>
    <dialog ref={deleteDialog} className="modal small-modal"><h2>Remove shortcut?</h2><p className="modal-description">“{deleting?.name}” will be removed from your hub.</p><div className="modal-actions"><button className="secondary-button" onClick={() => deleteDialog.current?.close()}>Cancel</button><button className="danger-button" onClick={() => { setShortcuts(s => s.filter(item => item.id !== deleting?.id)); deleteDialog.current?.close(); setNotice("Shortcut removed"); }}>Remove shortcut</button></div></dialog>
    {notice && <div className="toast" role="status"><Check size={17}/>{notice}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16}/></button></div>}
  </div>;
}
