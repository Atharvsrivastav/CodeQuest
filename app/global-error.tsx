"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="page-shell-tight">
          <section className="card stack-md">
            <span className="section-label">Critical Error</span>
            <h1 className="page-heading" style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}>
              The app could not render this page.
            </h1>
            <p className="page-copy">
              Please retry once. This usually fixes temporary compile or refresh issues in dev mode.
            </p>
            <div className="inline-cluster">
              <button type="button" className="btn btn-primary" onClick={reset}>
                Retry
              </button>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
