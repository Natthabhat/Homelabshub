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
- Create categories with **Add category**, then assign shortcuts to them in the shortcut editor. Categories are displayed as grouped sections and as filters across the top. Empty categories are saved too. Up to 500 shortcuts are supported.

Data is stored in this browser's localStorage for this site's origin. It is not shared across browsers, devices, ports, or hostnames. Keep browser data to preserve your shortcuts and categories. No backend, account, or network service health monitoring is included. External fonts are optional; the dashboard falls back to system fonts offline. Shortcut URLs are not sent to a favicon service.

## Checks

```powershell
npm run typecheck
npm run build
```

Built with Next.js App Router, React, TypeScript, Lucide icons, and plain CSS. Source files: `app/page.tsx`, `app/globals.css`, and `lib/shortcuts.ts`.

## Ubuntu deployment (port 3500)

With Docker Engine and Docker Compose installed, copy this project's source to a dedicated directory on the Ubuntu server, then run:

```sh
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3500/
```

Open `http://YOUR-SERVER-IP:3500`. The container runs as a non-root user and restarts automatically unless stopped. Inspect logs with `docker compose logs --tail=100 homelabshub` and stop this deployment with `docker compose down` from its directory.

The Docker image builds on Ubuntu, excluding Windows dependencies and build artifacts. Browser-local shortcuts and categories do not transfer automatically between different URLs or devices.
