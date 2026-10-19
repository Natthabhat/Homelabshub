export const COLORS = ["mint", "blue", "purple", "amber", "rose", "cyan"] as const;
export const ICONS = ["globe", "server", "database", "media", "code", "cloud", "shield", "home"] as const;
export type Shortcut = { id: string; name: string; url: string; category: string; color: typeof COLORS[number]; icon: typeof ICONS[number]; favorite: boolean; iconData?: string; createdAt: number };
export const STORAGE_KEY = "homelabshub.shortcuts.v1";
// randomUUID requires HTTPS; getRandomValues also works on HTTP LAN addresses.
export function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) throw new Error("Enter a website URL.");
  const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `http://${value}`);
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error("Use an HTTP or HTTPS URL without embedded credentials.");
  return url.href;
}
export function parseShortcuts(input: unknown): Shortcut[] {
  if (!Array.isArray(input) || input.length > 500) throw new Error("Choose a backup containing up to 500 shortcuts.");
  const ids = new Set<string>();
  return input.map((row: unknown) => {
    if (!row || typeof row !== "object") throw new Error("The backup contains an invalid shortcut.");
    const s = row as Record<string, unknown>;
    if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 80 || typeof s.url !== "string" || s.url.length > 2048) throw new Error("Each shortcut needs a valid name and URL.");
    const id = typeof s.id === "string" && s.id && !ids.has(s.id) ? s.id : newId(); ids.add(id);
    return { id, iconData: typeof s.iconData === "string" && s.iconData.length <= 100000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.iconData) ? s.iconData : undefined, name: s.name.trim(), url: normalizeUrl(s.url), category: typeof s.category === "string" ? s.category.trim().slice(0, 40) || "General" : "General", color: COLORS.includes(s.color as Shortcut["color"]) ? s.color as Shortcut["color"] : "mint", icon: ICONS.includes(s.icon as Shortcut["icon"]) ? s.icon as Shortcut["icon"] : "globe", favorite: s.favorite === true, createdAt: typeof s.createdAt === "number" && Number.isFinite(s.createdAt) ? s.createdAt : Date.now() };
  });
}

export function moveShortcut(items: Shortcut[], sourceId: string, targetId: string, after = false): Shortcut[] {
  if(sourceId===targetId)return items;
  const source=items.find(s=>s.id===sourceId),target=items.find(s=>s.id===targetId);
  if(!source||!target)return items;
  const next=items.filter(s=>s.id!==sourceId),index=next.findIndex(s=>s.id===targetId);
  next.splice(index+(after?1:0),0,{...source,category:target.category});
  return next;
}
