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
  --bg: #f5f7fb;
  --surface: #ffffff;
  --border: #d9e2f0;
  --text: #101a2f;
  --text-2: #51607d;
  --accent: #2563eb;
}
:root[data-theme="dark"] {
  --bg: #07101f;
  --surface: #0f1a30;
  --border: #243452;
  --text: #e9eefc;
  --text-2: #b2c0dd;
  --accent: #61a8ff;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
}
a { color: inherit; text-decoration: none; }
.app-main { min-height: calc(100vh - 72px); }
.page-shell, .page-shell-wide, .page-shell-tight {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  padding: 32px 0 72px;
}
.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(12px);
}
.nav-inner {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 14px 0;
}
.nav-end, .nav-links, .nav-session {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.nav-link, .theme-toggle, .btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
}
.nav-link-active { color: var(--text); border-color: color-mix(in srgb, var(--accent) 25%, var(--border)); }
.theme-toggle, .btn { cursor: pointer; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-ghost { color: var(--text-2); }
.card, .list-panel, .stat-card, .feature-link {
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  padding: 20px;
}
.section-label {
  display: inline-flex;
  margin: 0 0 0.8rem;
  color: var(--text-2);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.page-heading {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.06;
}
.page-copy { margin: 0; color: var(--text-2); line-height: 1.65; }
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
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('codequest-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);return;}var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',prefersDark?'dark':'light');}catch(_e){}})();"
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
