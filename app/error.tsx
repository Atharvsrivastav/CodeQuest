"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep a trace in devtools without crashing the full app shell.
    console.error(error);
  }, [error]);

  return (
    <div className="page-shell-tight">
      <section className="card stack-md">
        <span className="section-label">Something Went Wrong</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}>
          We hit an unexpected error.
        </h1>
        <p className="page-copy">
          Try refreshing once. If it happens again, click retry to recover this screen.
        </p>
        <div className="inline-cluster">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Retry
          </button>
        </div>
      </section>
    </div>
  );
}
