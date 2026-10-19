"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, ChevronRight, Cloud, Code2, Database, Folder, Globe2, Grid2X2, Home, LayoutGrid, List, GripVertical, ArrowUp, ArrowDown, MoreVertical, Network, Pencil, Play, Plus, Search, Server, Shield, Sparkles, Star, Trash2, X } from "lucide-react";
import { COLORS, ICONS, STORAGE_KEY, newId, normalizeUrl, parseShortcuts, moveShortcut, type Shortcut } from "../lib/shortcuts";

const iconMap = { globe: Globe2, server: Server, database: Database, media: Play, code: Code2, cloud: Cloud, shield: Shield, home: Home };
const blank = { name: "", url: "", category: "General", color: "mint" as Shortcut["color"], icon: "globe" as Shortcut["icon"], favorite: false, iconData: "" };

export default function Hub() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [dragging,setDragging]=useState<string|null>(null);
  const [dropTarget,setDropTarget]=useState<string|null>(null);
  const draggedId=useRef<string|null>(null);
  const [previewId,setPreviewId]=useState<string|null>(null);
  const previewTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  function closePreview(){if(previewTimer.current)clearTimeout(previewTimer.current);previewTimer.current=null;setPreviewId(null);}
  function schedulePreview(shortcut:Shortcut){closePreview();previewTimer.current=setTimeout(()=>{if(!draggedId.current)setPreviewId(shortcut.id);},2000);}
  useEffect(()=>()=>{if(previewTimer.current)clearTimeout(previewTimer.current);},[]);
  useEffect(()=>{closePreview();},[filter,query,view,sort]);
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
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setShortcuts(parseShortcuts(JSON.parse(saved))); const categories=JSON.parse(localStorage.getItem("homelabshub.categories.v1")||"[]"); if(!Array.isArray(categories)||categories.some(c=>typeof c!=="string"||!c.trim()||c.length>40)||categories.length>200)throw new Error("Invalid categories"); setSavedCategories(categories); const preferences=JSON.parse(localStorage.getItem("homelabshub.preferences.v1")||"{}"); if(["grid","list"].includes(preferences.view))setView(preferences.view); if(["manual","newest","oldest","name"].includes(preferences.sort))setSort(preferences.sort); }
    catch { setStorageBlocked(true); setStorageError("Saved shortcuts could not be loaded. Your existing browser data has been preserved. New links cannot be saved until browser storage is available."); }
    setReady(true);
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); searchInput.current?.focus(); }
    };
    const closeMenus=(event: Event)=>{document.querySelectorAll<HTMLDetailsElement>('.shortcut-menu[open]').forEach(menu=>{if(event.type==='keydown'?(event as KeyboardEvent).key==='Escape':!menu.contains(event.target as Node))menu.open=false;});};
    document.addEventListener('pointerdown',closeMenus);document.addEventListener('keydown',closeMenus);
    window.addEventListener("keydown", handler);
    return () => {window.removeEventListener('keydown',handler);document.removeEventListener('pointerdown',closeMenus);document.removeEventListener('keydown',closeMenus);};
  }, []);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts)); setStorageError(""); }
    catch { setStorageError("Browser storage is unavailable or full. Changes may not persist after closing this page."); }
  }, [shortcuts, ready, storageBlocked]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(timer); }, [notice]);

  useEffect(()=>{if(!ready||storageBlocked)return;try{localStorage.setItem("homelabshub.categories.v1",JSON.stringify(savedCategories));}catch{setStorageError("Categories could not be saved in this browser.");}},[savedCategories,ready,storageBlocked]);
  useEffect(()=>{if(!ready||storageBlocked)return;try{localStorage.setItem("homelabshub.preferences.v1",JSON.stringify({view,sort}));}catch{setStorageError("Your layout preference could not be saved.");}},[view,sort,ready,storageBlocked]);
  const compareShortcuts=(a:Shortcut,b:Shortcut)=>sort==='manual'?0:sort==='name'?a.name.localeCompare(b.name):sort==='oldest'?a.createdAt-b.createdAt:b.createdAt-a.createdAt;
  function arrange(sourceId:string,targetId:string,after=false){setShortcuts(current=>moveShortcut([...current].sort(compareShortcuts),sourceId,targetId,after));setSort('manual');setDragging(null);setDropTarget(null);draggedId.current=null;setNotice('Shortcut order saved');}
  function moveByKeyboard(shortcut:Shortcut,direction:number){const group=visible.filter(s=>s.category===shortcut.category),index=group.findIndex(s=>s.id===shortcut.id),target=group[index+direction];if(target)arrange(shortcut.id,target.id,direction>0);}
  const categories = Array.from(new Set([...savedCategories,...shortcuts.map(s => s.category)])).sort();
  const favorites = shortcuts.filter(s => s.favorite).length;
  const visible = shortcuts.filter(s => (filter === "all" || (filter === "favorites" ? s.favorite : s.category === filter.slice(4))) && `${s.name} ${s.url} ${s.category}`.toLowerCase().includes(query.toLowerCase())).sort(compareShortcuts);
  const title = filter === "all" ? "All shortcuts" : filter === "favorites" ? "Favorites" : filter.slice(4);

  function openForm(shortcut?: Shortcut) {
    setEditing(shortcut?.id ?? null); setDraft(shortcut ? { ...shortcut, iconData: shortcut.iconData || "" } : { ...blank, category: filter.startsWith("cat:") ? filter.slice(4) : "General" }); setFormError(""); formDialog.current?.showModal();
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


        {storageError && <p className="error-banner" role="alert">{storageError}</p>}
        <section className="category-manager" aria-label="Manage categories"><div><h2>Categories</h2><p>Create a category, then assign it when adding or editing a shortcut.</p></div><form onSubmit={addCategory}><input aria-label="New category name" placeholder="New category name" maxLength={40} required value={categoryName} disabled={!ready||storageBlocked} onChange={e=>setCategoryName(e.target.value)}/><button className="secondary-button" disabled={!ready||storageBlocked}><Plus size={16}/>Add category</button></form><button className="primary-button" disabled={!ready} onClick={() => openForm()}><Plus size={18}/>Add shortcut</button>{categoryError&&<p className="form-error" role="alert">{categoryError}</p>}</section>
        <nav className="category-tabs" aria-label="Filter shortcuts by category"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All shortcuts <span>{shortcuts.length}</span></button><button className={filter==='favorites'?'active':''} onClick={()=>setFilter('favorites')}><Star size={14}/>Favorites <span>{favorites}</span></button>{categories.map(c=><button key={c} className={filter===`cat:${c}`?'active':''} onClick={()=>setFilter(`cat:${c}`)}><Folder size={14}/>{c}<span>{shortcuts.filter(s=>s.category===c).length}</span></button>)}</nav>
        <section className="shortcuts-section"><div className="section-heading"><div><h2>{title}<span>{visible.length}</span></h2></div></div>
        <div className="toolbar"><label className="search-field"><Search size={18}/><input ref={searchInput} aria-label="Search shortcuts" placeholder="Search your shortcuts…" value={query} onChange={event => setQuery(event.target.value)}/>{query ? <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button> : <kbd>Ctrl K</kbd>}</label><div className="toolbar-right"><select aria-label="Sort shortcuts" value={sort} onChange={event => setSort(event.target.value)}><option value="manual">Manual order</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select><div className="view-toggle"><button className={view === "grid" ? "selected" : ""} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={17}/></button><button className={view === "list" ? "selected" : ""} aria-label="Detail view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={19}/></button></div></div></div>
        {!ready ? <div className="empty-state"><p>Loading your workspace…</p></div> : (visible.length || (!query && filter!=="favorites" && categories.length>0)) ? <div className="category-groups">{categories.filter(category=>filter.startsWith('cat:')?category===filter.slice(4):(!query&&filter==='all')||visible.some(s=>s.category===category)).map(category=><section className="shortcut-category" key={category}><div className="category-heading"><h3><Folder size={18}/>{category}<span>{visible.filter(s=>s.category===category).length}</span></h3><button className="secondary-button" onClick={()=>{openForm();setDraft({...blank,category});}}><Plus size={14}/>Add shortcut</button></div><div className={`shortcut-grid ${view==='list'?'list-view':''}`}>{visible.filter(s=>s.category===category).map(s => { const Icon = iconMap[s.icon]; return <article onPointerEnter={e=>{if(e.pointerType==='mouse')schedulePreview(s);}} onPointerLeave={closePreview} onKeyDown={e=>{if(e.key==='Escape')closePreview();}} className={`shortcut-card ${previewId===s.id?'has-preview':''} ${dragging===s.id?'is-dragging':''} ${dropTarget===s.id?'is-drop-target':''}`} key={s.id} onDragOver={e=>{if(draggedId.current&&draggedId.current!==s.id){e.preventDefault();e.dataTransfer.dropEffect='move';setDropTarget(s.id);}}} onDragLeave={e=>{if(!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)))setDropTarget(null);}} onDrop={e=>{e.preventDefault();const source=draggedId.current;if(source){const rect=e.currentTarget.getBoundingClientRect();arrange(source,s.id,e.clientY>rect.top+rect.height/2);}}}>
<button className="drag-handle" draggable aria-label={`Drag to arrange ${s.name}`} title="Drag to arrange" onDragStart={e=>{closePreview();draggedId.current=s.id;setDragging(s.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',s.id);}} onDragEnd={()=>{draggedId.current=null;setDragging(null);setDropTarget(null);}}><GripVertical size={18}/></button><a draggable={false} href={s.url} target="_blank" rel="noopener noreferrer" className="shortcut-link" aria-label={`Open ${s.name} in a new tab`}><span className={`service-icon ${s.color}`}>{s.iconData?<img draggable={false} src={s.iconData} alt="" className="custom-icon"/>:<Icon size={25}/>}</span><div className="shortcut-info"><h3>{s.name}</h3><p>{s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p></div><ArrowUpRight className="launch-arrow" size={18}/></a><details className="shortcut-menu"><summary onClick={closePreview} aria-label={`Actions for ${s.name}`}><MoreVertical size={21}/></summary><div className="shortcut-menu-items"><button onClick={e=>{toggleFavorite(s.id);e.currentTarget.closest('details')?.removeAttribute('open');}}><Star size={16}/>{s.favorite?'Remove favorite':'Favorite'}</button><button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');openForm(s);}}><Pencil size={16}/>Edit</button><button disabled={visible.filter(item=>item.category===s.category)[0]?.id===s.id} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');moveByKeyboard(s,-1);}}><ArrowUp size={16}/>Move up</button><button disabled={visible.filter(item=>item.category===s.category).at(-1)?.id===s.id} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');moveByKeyboard(s,1);}}><ArrowDown size={16}/>Move down</button><button className="delete-button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setDeleting(s);deleteDialog.current?.showModal();}}><Trash2 size={16}/>Delete</button></div></details>{previewId===s.id&&<div className="page-preview" role="region" aria-label={`Page preview for ${s.name}`}><div className="page-preview-panel"><div className="page-preview-heading"><strong>{s.name}</strong><button className="icon-button" aria-label="Close page preview" onClick={closePreview}><X size={16}/></button></div>{typeof window!=='undefined'&&window.location.protocol==='https:'&&s.url.startsWith('http:')?<p className="preview-message">This HTTP page cannot be previewed inside an HTTPS website.</p>:<div className="preview-frame"><iframe src={s.url} title={`Preview of ${s.name}`} sandbox="allow-scripts" referrerPolicy="no-referrer" tabIndex={-1}/></div>}<div className="preview-footer"><span>Some sites block embedded previews.</span><a href={s.url} target="_blank" rel="noopener noreferrer">Open page <ArrowUpRight size={13}/></a></div></div></div>}</article>; })}</div>{!visible.some(s=>s.category===category)&&<p className="empty-category">No shortcuts in this category yet.</p>}</section>)}</div> : <div className="empty-state">{shortcuts.length === 0 && !query ? <><div className="empty-orbit"><span className="orbit-mini orbit-one"><Database size={18}/></span><span className="empty-main-icon"><Network size={35}/></span><span className="orbit-mini orbit-two"><Cloud size={19}/></span><span className="orbit-mini orbit-three"><Server size={18}/></span></div><span className="empty-kicker">A NEW HOME FOR YOUR HOMELAB</span><h3>Great things start with a shortcut.</h3><p>Your media server, NAS, dashboards, and side projects.<br/>Bring them together in a space that’s yours.</p><button className="primary-button" onClick={() => openForm()}><Plus size={17}/>Add your first shortcut</button><span className="empty-note">Just a name and a URL. That’s all you need.</span></> : <><Search size={30}/><h3>{filter === "favorites" && !query ? "Keep your favorites close." : "No shortcuts found."}</h3><p>{filter === "favorites" && !query ? "Click the star on any shortcut to find it here." : "Try a different search or add a shortcut to this space."}</p><button className="secondary-button" onClick={() => { setQuery(""); setFilter("all"); }}>Show all shortcuts</button></>}</div>}
        </section>

      </main>
    </div>
    <dialog ref={formDialog} className="modal"><form onSubmit={save}><div className="modal-header"><span className="modal-icon mint"><Plus size={22}/></span><button type="button" className="icon-button" onClick={() => formDialog.current?.close()} aria-label="Close editor"><X size={20}/></button></div><h2>{editing ? "Edit shortcut" : "A new connection."}</h2><p className="modal-description">Give your service a name and a place in your hub.</p><label>Website name<input autoFocus required maxLength={80} placeholder="e.g. My media server" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>Website URL<input required maxLength={2048} placeholder="http://192.168.1.10:8096" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })}/><small>Local IPs, hostnames, and HTTPS websites are welcome.</small></label><label>Category<select aria-label="Shortcut category" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{Array.from(new Set(['General',...categories,draft.category])).filter(Boolean).sort().map(category=><option key={category} value={category}>{category}</option>)}</select></label><fieldset><legend>Choose an icon</legend><div className="icon-picker">{ICONS.map(icon => { const Icon = iconMap[icon]; return <button className={draft.icon === icon ? "chosen" : ""} type="button" key={icon} aria-label={`${icon} icon`} aria-pressed={draft.icon === icon} onClick={() => setDraft({ ...draft, icon, iconData:"" })}><Icon size={20}/></button>; })}</div></fieldset><fieldset><legend>Custom icon</legend><label className="icon-upload-label">Upload PNG, JPG, or WebP<input aria-label="Upload custom icon" type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const input=e.currentTarget,file=input.files?.[0];if(!file)return;setFormError('');try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Choose a PNG, JPG, or WebP image up to 5 MB.');const bitmap=await createImageBitmap(file);try{const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const context=canvas.getContext('2d');if(!context)throw new Error('Icon processing is unavailable.');const scale=Math.min(128/bitmap.width,128/bitmap.height);context.drawImage(bitmap,(128-bitmap.width*scale)/2,(128-bitmap.height*scale)/2,bitmap.width*scale,bitmap.height*scale);const iconData=canvas.toDataURL('image/png');if(iconData.length>100000)throw new Error('This icon is too large after resizing.');setDraft(current=>({...current,iconData}));}finally{bitmap.close();}}catch(error){setFormError(error instanceof Error?error.message:'Could not read this image.');}finally{input.value='';}}}/></label>{draft.iconData&&<div className="custom-icon-preview"><img src={draft.iconData} alt="Custom icon preview"/><button type="button" className="secondary-button" onClick={()=>setDraft({...draft,iconData:''})}>Remove custom icon</button></div>}</fieldset><fieldset><legend>Accent color</legend><div className="color-picker">{COLORS.map(color => <button type="button" key={color} className={`color-swatch ${color}`} aria-label={`${color} accent`} aria-pressed={draft.color === color} onClick={() => setDraft({ ...draft, color })}>{draft.color === color && <Check size={17}/>}</button>)}</div></fieldset><label className="checkbox-label"><input type="checkbox" checked={draft.favorite} onChange={e => setDraft({ ...draft, favorite: e.target.checked })}/><Star size={16}/>Add to favorites</label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => formDialog.current?.close()}>Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Add shortcut"}<ArrowUpRight size={16}/></button></div></form></dialog>
    <dialog ref={deleteDialog} className="modal small-modal"><h2>Remove shortcut?</h2><p className="modal-description">“{deleting?.name}” will be removed from your hub.</p><div className="modal-actions"><button className="secondary-button" onClick={() => deleteDialog.current?.close()}>Cancel</button><button className="danger-button" onClick={() => { setShortcuts(s => s.filter(item => item.id !== deleting?.id)); deleteDialog.current?.close(); setNotice("Shortcut removed"); }}>Remove shortcut</button></div></dialog>
    {notice && <div className="toast" role="status"><Check size={17}/>{notice}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16}/></button></div>}
  </div>;
}
