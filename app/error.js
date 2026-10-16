'use client';

// Shown instead of a blank page when something unexpected breaks.
// To get told about such errors, connect Sentry (see README, "Error tracking").
export default function Error({ reset }) {
  return (
    <div className="page">
      <main className="body">
        <h1>Something went wrong</h1>
        <p>Sorry. Please try again. If it keeps happening, use the correction page to tell us.</p>
        <button type="button" className="btn dark" onClick={reset}>Try again</button>
      </main>
    </div>
  );
}
