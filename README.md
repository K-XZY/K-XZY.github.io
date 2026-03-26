# Personal Research Website

> k-xzy.github.io — JadeRegent theme

## Architecture

Pure static HTML + CSS + JS. No build step, no JSON data files, no frameworks.

```
website/
├── index.html              # Homepage: about + research projects
├── blog.html               # Blog archive page
├── css/style.css           # JadeRegent theme (single stylesheet)
├── js/
│   ├── components.js       # Shared nav, footer, mobile menu, parallax
│   ├── main.js             # Homepage: about rendering, language, email copy
│   ├── navigation.js       # Back/forward history stack
│   └── diagrams.js         # D3 diagrams (used by JEPA post)
├── posts/
│   ├── *.html              # Each blog post is a standalone HTML file
│   ├── images/             # Post images
│   └── data/               # Post data (CSV for charts, etc.)
├── photos/                 # Profile photos
├── drafts/                 # Markdown drafts (not published)
├── sitemap.xml             # SEO sitemap (manually maintained)
├── robots.txt              # Crawl rules
├── design-proposals.html   # Design preview (dev only)
└── test-chart.html         # Chart testing (dev only)
```

### Git

`website/` is a submodule of the parent research-notes repo.

```
origin:  K-XZY/kevinxie-website.git     # development
```

Deployed via GitHub Pages from `main` branch → https://k-xzy.github.io

---

## Design System — JadeRegent

### Philosophy

Restraint. Every element earns its place. Inspired by the precision of jade craft — sharp, clean, valuable.

### Design Principles

| Principle                    | Expression                                              |
| ---------------------------- | ------------------------------------------------------- |
| **Thinking Outside the Box** | Avatar breaks card boundary — innovation spirit          |
| **Depth**                    | Nav sidebar 3D-tilted toward content, spatial hierarchy  |
| **Precision**                | 3px border-radius everywhere — sharp but not harsh       |
| **Breathing room**           | Repeating items (project/post list) use lines, no boxes  |
| **Feedback**                 | Hover triggers jade-bright underline, cosine-fade glow   |

### Color Palette

```css
:root {
  /* Background layers */
  --void: #080a08;           /* page background */
  --surface: #0b0d0b;        /* card background */
  --elevated: #0e100e;       /* avatar, elevated elements */

  /* Border */
  --line: rgba(255, 255, 255, 0.12);
  --line-hover: rgba(255, 255, 255, 0.2);

  /* Jade green — core visual identity */
  --jade: #1a2e1a;           /* deep jade */
  --jade-light: #243824;     /* default underline */
  --jade-bright: #39ff14;    /* hover glow, links, status indicators */

  /* Dark gold — accent for names and hover titles */
  --accent: #a08c5b;

  /* Text layers */
  --text-primary: #f5f5f5;
  --text-secondary: #b8b8b8;
  --text-tertiary: #7a7a7a;
  --text-quaternary: #4a4a4a;
}
```

### Typography

```css
:root {
  --font-sans: "Avenir Next", "Avenir", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: "Palatino", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  --font-mono: "Menlo", "SF Mono", "Fira Code", monospace;
}
```

- **Body text**: `--font-sans` (Avenir Next) — all content, bio, summaries, post content
- **Code**: `--font-mono` (Menlo)
- **Serif**: defined but not currently used (Palatino doesn't suit dark backgrounds)

### Link Styling

All content links use jade-bright green with opacity-based hover:

```css
a {
  color: var(--jade-bright);
  opacity: 0.6;
  transition: opacity 0.15s;
}
a:hover {
  opacity: 1;
}
```

Social links (GitHub, LinkedIn, Email) in the about section use `--text-tertiary` → `--text-primary` on hover.

### Interactive Elements

**Navigator (sidebar)**:
- Fixed left, `perspective(800px) rotateY(8deg) scale(1.25)`
- Mouse parallax on desktop (>1001px)
- Contains: Home, Blog links + language switcher + history buttons
- Mobile: slide-in drawer with hamburger toggle

**Jade underline (hover feedback)**:
- Default: `--jade-light` (#243824)
- On hover: 0.3s transition to `--jade-bright` (#39ff14)
- Then cosine-fade animation (8s) from bright → `#2a5a2a`
- Applied to: about card bottom, avatar bottom, post items bottom border

**Avatar** ("Thinking Outside the Box"):
- 140×140px, absolute positioned to overflow the about card
- Left: -40px, Top: -24px (desktop)
- Right-aligned on tablet, centered on mobile

**Project/post items**:
- No card borders — separated by thin `--line` borders
- Hover: subtle left-shift, jade-bright bottom border, title turns gold

**Status indicators**:
- `.status-ongoing` — jade-bright green at 0.6 opacity

### Layout Breakpoints

| Breakpoint | Behavior                                      |
| ---------- | --------------------------------------------- |
| >1200px    | Full layout: nav left, content right 10%      |
| 1001-1200  | Reduced nav, content shifts left              |
| ≤1000px    | Mobile: hamburger menu, full-width content    |
| ≤600px     | Compact: centered avatar, stacked layout      |

---

## Pages

### Homepage (`index.html`)

- About section with avatar, bio, social links
- Research Projects section (ongoing + future completed)
- Small link to blog archive

### Blog (`blog.html`)

- Disclaimer at top ("old ideas, kept for reference")
- Static list of blog post cards

### Post pages (`posts/*.html`)

Each post is a self-contained HTML file with:
- Full `<head>` (meta, OG tags, Twitter cards)
- `<meta name="page-languages">` for per-post language config
- `<div id="nav-root"></div>` — nav injected by `components.js`
- `<div id="footer-root"></div>` — footer injected by `components.js`
- Post-specific inline `<style>` and `<script>` as needed

### Shared Components (`components.js`)

Injected on every page via `<div id="nav-root"></div>` and `<div id="footer-root"></div>`:
- Navigator sidebar with nav links, language switcher, history buttons
- Mobile menu toggle + overlay
- Footer with dynamic year
- 3D parallax effect
- Language button tooltips
- Post-page language switching (body class-based)
- Reference tooltip positioning

---

## Workflow

### Add a new research project

Edit `index.html`, add inside `.posts-list`:

```html
<div class="post">
  <div class="post-title">Project Title</div>
  <div class="post-meta status-ongoing">on-going</div>
  <p class="post-summary">Description.</p>
  <div class="post-tags">
    <span class="post-tag">tag</span>
  </div>
</div>
```

### Add a new blog post

1. Create `posts/slug.html` (use existing posts as template)
2. Add `<article>` entry in `blog.html`
3. Add `<url>` entry in `sitemap.xml`
4. Push

### Deploy

```bash
cd website
git add -A
git commit -m "description"
git push origin main
```

GitHub Pages auto-deploys from `main`.

---

## SEO

### Implemented
- Google Site Verification meta tag
- Meta descriptions on all pages
- Open Graph tags (homepage + all posts)
- Twitter Card tags (all posts)
- `sitemap.xml` (manually maintained)
- `robots.txt`
- All content is static HTML (no JS-dependent rendering for crawlers)
- Semantic HTML (`<article>`, `<header>`, `<main>`, `<nav>`, `<section>`)

### To consider
- Schema.org JSON-LD for Person and Article types
- Canonical URLs on all pages
- Alt text on all images
- Internal linking between related posts

---

## Changelog

### 2026-03-26 — Static Architecture Migration
- Removed `build.py`, `config.yaml`, `config.json`, `posts.json`, `post.html`, `post.js`
- Created `components.js` for shared nav/footer injection
- Rewrote `main.js` — no JSON fetches, inline translations, DOM-based
- All posts updated to use `components.js` instead of duplicated nav/footer/inline JS
- Cleaned up iCloud conflict duplicate files (`* 2.*`)
- Homepage restructured: about + research projects (no blog list)
- Created dedicated `blog.html` for archived posts
- Nav updated: "Posts" → "Blog" (links to blog.html)
- Typography: Avenir Next (sans), Menlo (mono)
- Text brightened: secondary #999→#b8b8b8, tertiary #666→#7a7a7a
- Links: jade-bright green with opacity hover throughout
- SEO: updated meta descriptions, titles, added OG tags to homepage
