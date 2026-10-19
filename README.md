# Homelabs Hub

A responsive Next.js dashboard for your homelab websites. Add a name and URL, organize shortcuts into categories, star favorites, search, and switch between grid and list views.

## Run

Requires Node.js 20.9 or newer and npm.

```powershell
cd C:\Users\natth\Desktop\Web\Nextjs\Homelabshub
npm install
npm run dev
```

Open http://localhost:3000. For production, run `npm run build` followed by `npm start`. Both servers bind to `0.0.0.0`, so you can also open `http://YOUR-SERVER-IP:3000` from your home network when permitted by your firewall.

## Your shortcuts

- Click **Add shortcut**. Only the name and URL are required; categories, icons, accent colors, and favorites are optional.
- URLs can be HTTP or HTTPS, including local IPs, ports, and hostnames. Addresses without a scheme default to HTTP, which works well for local services. Use an explicit `https://` for HTTPS services.
- Shortcuts open in a new tab. Edit, favorite, or remove them using the buttons on each card.
- **Ctrl+K** (or **Cmd+K**) focuses search.
- **Export** downloads a JSON backup. **Import** validates and merges a backup after confirmation, preserving current shortcuts and skipping repeated name/URL pairs. Up to 500 shortcuts are supported.

Data is stored in this browser's localStorage for this site's origin. It is not shared across browsers, devices, ports, or hostnames. Export a backup before clearing browser data or moving the site. No backend, account, or network service health monitoring is included. External fonts are optional; the dashboard falls back to system fonts offline. Shortcut URLs are not sent to a favicon service.

## Checks

```powershell
npm run typecheck
npm run build
```

Built with Next.js App Router, React, TypeScript, Lucide icons, and plain CSS. Source files: `app/page.tsx`, `app/globals.css`, and `lib/shortcuts.ts`.
