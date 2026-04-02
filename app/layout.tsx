import type { Metadata } from "next";
import type { ReactNode } from "react";

import Nav from "./Nav";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeQuest",
  description: "CodeQuest is an AI-powered coding platform with challenges, tutoring, editor tools, and progress tracking."
};

const criticalCss = `
:root {
  --font-sans: "Manrope";
  --font-display: "Space Grotesk";
  --font-mono: "IBM Plex Mono";
  --bg-top: #fcfdff;
  --bg: #f7fbff;
  --bg-2: #eef5ff;
  --surface: #ffffff;
  --surface-2: #f7fbff;
  --border: #d7e4f1;
  --text: #17233b;
  --text-2: #5f6f89;
  --accent: #3385ff;
  --accent-2: #14b8a6;
  --accent-light: #e8f1ff;
}
:root[data-theme="dark"] {
  --bg-top: #08111d;
  --bg: #07111f;
  --bg-2: #0f1f34;
  --surface: #0f1b2f;
  --surface-2: #14233a;
  --border: #243856;
  --text: #eaf1ff;
  --text-2: #afc0dd;
  --accent: #72adff;
  --accent-2: #29d2c3;
  --accent-light: #122847;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  min-height: 100vh;
  background:
    radial-gradient(900px 520px at -5% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
    radial-gradient(860px 520px at 100% 0%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 58%),
    linear-gradient(180deg, var(--bg-top) 0%, var(--bg) 48%, var(--bg-2) 100%);
  color: var(--text);
  font-family: var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
}
h1, h2, h3, .nav-brand { font-family: var(--font-display), var(--font-sans), sans-serif; }
a { color: inherit; text-decoration: none; }
.app-main { min-height: calc(100vh - 72px); }
.page-shell, .page-shell-wide, .page-shell-tight {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  padding: 42px 0 82px;
}
.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  padding-top: 16px;
  background: transparent;
}
.nav-inner {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 14px 18px;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
  background: color-mix(in srgb, var(--surface) 76%, transparent);
  box-shadow: 0 24px 60px -44px color-mix(in srgb, var(--accent) 42%, transparent);
  backdrop-filter: blur(20px);
}
.nav-end, .nav-links, .nav-session {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.nav-end { flex: 1 1 auto; justify-content: space-between; }
.nav-links { flex: 1 1 auto; justify-content: center; }
.nav-brand { gap: 0.85rem; }
.nav-brand-mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent-2) 72%, white));
}
.nav-brand-copy { display: flex; flex-direction: column; gap: 0.05rem; }
.nav-brand-copy strong { font-size: 1rem; line-height: 1.05; letter-spacing: -0.04em; }
.nav-brand-copy span {
  color: var(--text-2);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.nav-dot, .nav-dot-secondary { position: absolute; border-radius: 999px; }
.nav-dot {
  width: 18px;
  height: 18px;
  background: #fff;
}
.nav-dot-secondary {
  width: 10px;
  height: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px solid color-mix(in srgb, white 75%, transparent);
  background: color-mix(in srgb, var(--accent-2) 84%, white);
}
.nav-link, .theme-toggle, .btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  color: var(--text-2);
}
.nav-link-active {
  color: var(--text);
  border-color: color-mix(in srgb, var(--accent) 24%, var(--border));
  background: color-mix(in srgb, var(--accent-light) 78%, transparent);
}
.theme-toggle, .btn { cursor: pointer; }
.btn-primary {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 92%, #a6c7ff), var(--accent));
  border-color: color-mix(in srgb, var(--accent) 84%, transparent);
  color: #fff;
}
.btn-ghost { color: var(--text-2); }
.card, .list-panel, .stat-card, .feature-link {
  border: 1px solid var(--border);
  border-radius: 28px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: 0 24px 60px -44px color-mix(in srgb, var(--accent) 42%, transparent);
  padding: 22px;
}
.section-label {
  display: inline-flex;
  margin: 0 0 0.8rem;
  color: var(--text-2);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.page-heading {
  margin: 0;
  font-size: clamp(2.2rem, 4.2vw, 3.7rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}
.page-copy { margin: 0; color: var(--text-2); line-height: 1.7; }
.hero-grid, .split-grid, .feature-grid, .stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}
.feature-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.stack-sm > * + * { margin-top: 0.8rem; }
.stack-md > * + * { margin-top: 1rem; }
.stack-lg > * + * { margin-top: 1.5rem; }
.inline-cluster, .row-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.78rem;
}
.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.list-row:last-child { border-bottom: 0; padding-bottom: 0; }
.list-row-main { display: flex; align-items: flex-start; gap: 0.9rem; min-width: 0; }
.list-row-title { margin: 0 0 0.25rem; }
.list-row-desc { margin: 0; color: var(--text-2); }
.circle {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid var(--border);
  flex: 0 0 auto;
}
@media (max-width: 1024px) {
  .hero-grid, .split-grid, .feature-grid, .stats-grid { grid-template-columns: 1fr; }
}
`;

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('codequest-theme-v2');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(_e){document.documentElement.setAttribute('data-theme','light');}})();"
          }}
        />
        <style id="cq-critical-css" dangerouslySetInnerHTML={{ __html: criticalCss }} />
      </head>
      <body>
        <Providers>
          <Nav />
          <main className="app-main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
