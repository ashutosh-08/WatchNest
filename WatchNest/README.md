# WatchNest (Frontend)

A clean, modern React frontend for the WatchNest video platform.

Quick start

1. Change to the project folder:

```bash
cd WatchNest
```

2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

Notes:
- The dev server proxies `/api` calls to `http://localhost:8000` (backend).
- Tailwind is configured; edit `tailwind.config.cjs` and `src/styles/index.css` to customize.

Folder structure

- `src/` - React source
  - `pages/` - `Home`, `Watch`
  - `components/` - `Navbar`
  - `utils/api.js` - axios client
  - `styles/` - Tailwind entry

Next steps you may want me to do:
- Add authentication flows (login/signup) and UI
- Build video upload UI integrated with backend `multipart` endpoints
- Add comments sidebar and subscribe/like features
- Polish UI animations and accessibility
