import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell-tight">
      <section className="card stack-md">
        <span className="section-label">Not Found</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.7rem, 3vw, 2.3rem)" }}>
          This page does not exist.
        </h1>
        <p className="page-copy">
          The route might be invalid or removed. Head back to Home and continue from there.
        </p>
        <div className="inline-cluster">
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </section>
    </div>
  );
}
