"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const links = [
  { href: "/", label: "Home" },
  { href: "/challenges", label: "Challenges" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tutor", label: "AI Tutor" },
  { href: "/code", label: "Editor" },
  { href: "/progress", label: "Progress" }
];

export default function Nav() {
  const pathname = usePathname();
  const { user, loading, actionLoading, signInWithGoogle, signOut } = useAuth();
  const { theme, resolved, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayName = user?.displayName?.trim() || user?.email || "Coder";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <span className="nav-dot" aria-hidden="true" />
          <span>CodeQuest</span>
        </Link>

        <div className="nav-end">
          <nav className="nav-links" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive(link.href) ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Toggle color theme"
          >
            {resolved ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
          </button>

          <div className="nav-session">
            {loading ? (
              <span className="text-subtle">Checking session...</span>
            ) : user ? (
              <>
                <div className="nav-user">
                  {user.photoURL ? (
                    <img className="nav-avatar" src={user.photoURL} alt={displayName} />
                  ) : (
                    <span className="nav-avatar nav-avatar-fallback">{initials || "CQ"}</span>
                  )}
                  <div className="nav-user-copy">
                    <strong>{displayName}</strong>
                    <span className="text-subtle">Progress sync on</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void signOut()}
                  disabled={actionLoading}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void signInWithGoogle()}
                disabled={actionLoading}
              >
                {actionLoading ? "Signing in..." : "Sign in with Google"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
