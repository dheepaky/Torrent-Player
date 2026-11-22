# Torrent Player

A modern, high-performance in-browser torrent streaming web app built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **WebTorrent v2** via **WebRTC**.

Stream video files instantly from magnet links, info hashes, or `.torrent` files with zero server storage, zero third-party plugins, and 100% decentralized peer-to-peer playback.

---

## Features

- **Instant Browser Playback**: Streams video directly using HTML5 `<video>`, ServiceWorker streaming, and WebRTC data channels.
- **Hold for 2× Speed**: Press and hold on the video player (mouse or touch) for instant 2× fast-forward with visual indicator badge.
- **Dark & Light Mode**: Complete theme system with automatic system preference detection and instant toggle.
- **Torrent File Import**: Paste magnet URIs, enter 40-character info hashes, or import local `.torrent` files directly.
- **Audio Booster**: Built-in Web Audio API gain node boosting volume up to 300%.
- **Subtitle Support**: Automatic subtitle detection from torrent swarms, drag-and-drop subtitle files (`.srt`, `.vtt`), and real-time WebVTT conversion.
- **Swarm Lookahead Buffering**: Intelligent background piece prioritization buffers continuously forward even when playback is paused.
- **External Player Hand-off**: One-click streaming hand-off to VLC, IINA, PotPlayer, MPV, or `.M3U` playlist download.
- **Local Privacy**: 100% client-side. Watch history, resume positions, and tracker preferences stay strictly in browser `localStorage`.
- **Advanced SEO & Crawlability**: Comprehensive OpenGraph, Twitter Cards, Schema.org JSON-LD (`WebApplication`, `FAQPage`, `HowTo`), automated sitemap, and pre-rendered semantic HTML for Google search ranking.

---

## Getting Started

### Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

### Production Build
```bash
# Build optimized production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```
├── public/                 # Static assets served at root
│   ├── assets/             # Logos, icons, and illustrations
│   ├── favicon.png         # High-resolution site favicon
│   ├── sw.min.js           # WebTorrent streaming Service Worker
│   └── webtorrent.min.js   # Vendored WebTorrent browser bundle
├── src/
│   ├── components/         # Modular React UI components
│   │   └── modals/         # Modal dialogs (Settings, History, About, Legal)
│   ├── context/            # React Context providers (ThemeContext, WebTorrentContext)
│   ├── utils/              # Pure utility modules (audio, storage, subtitles, format, etc.)
│   ├── App.jsx             # Main application layout
│   ├── index.css           # Tailwind CSS v4 styling
│   └── main.jsx            # Application entry point
├── index.html              # Vite HTML entry point
├── package.json            # Project dependencies & npm scripts
└── vite.config.js          # Vite configuration
```

---

## License

MIT License.
