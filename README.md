


# Booklet – Minimal Pocket/Raindrop Alternative

## Features

✅ Save articles, PDFs, and documents from anywhere
✅ Tag, favorite, and archive items
✅ Powerful search and filter
✅ Distraction-free reading view (with reading progress)
✅ Responsive, mobile-first UI
✅ Offline support (PWA)
✅ Installable on any device

⚡️ Planned/Future
- Highlights & notes
- Folders/collections
- Import/export (Pocket, Raindrop)
- Sharing & collaboration
- Multi-device sync

## Technology Stack
- React + Vite
- Tailwind CSS
- PWA (Service Worker + Manifest)

## Installation & Local Development

**Prerequisites:**
- Node.js (v16+)
- npm or yarn

**Steps:**

```bash
git clone https://github.com/yourusername/booklet.git
cd booklet
npm install
npm run dev
```

Open http://localhost:5173 (or the port shown) in your browser.

---

## Deploying to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repo
4. Vercel auto-detects Vite/React (build: `npm run build`, output: `dist`)
5. Click "Deploy" and get your live URL

---

## Usage
- Open the app → add articles, PDFs, or documents
- Tag, favorite, archive, and search your items
- Click any item for a clean reading view
- Install as a PWA for offline access

## File Structure

/public
   manifest.json
   service-worker.js
/src
   App.jsx
   components/
   utils/
   index.css
   main.jsx
package.json
README.md

## PWA Features
- Installable: Add Booklet to your home screen
- Offline support: Read and manage your library anywhere
- Responsive: Mobile and desktop ready

## Contributing
1. Fork the repository
2. Create a new branch feature/your-feature
3. Commit changes and push branch
4. Open a Pull Request with a clear description

## License

This project is licensed under the MIT License. See LICENSE for details.