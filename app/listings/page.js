"use client";

import { useEffect, useState } from "react";
import { supabase, isConfigured, cleanSearch } from "../../lib/supabase";

export default function Listings() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Read the starting filters from the web address once.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") || "");
    setKind(p.get("kind") || "");
    setCategory(p.get("category") || "");
    setReady(true);
    if (isConfigured) {
      supabase
        .from("categories")
        .select("id,name")
        .order("name")
        .then(({ data }) => setCategories(data || []));
    }
  }, []);

  useEffect(() => {
    if (!ready || !isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    let query = supabase
      .from("listings")
      .select(
        "id,kind,title,description,phone,whatsapp,area,hours,source,verified_at,updated_at,categories(name)"
      )
      .eq("status", "approved")
      .order("title")
      .limit(100);
    if (kind) query = query.eq("kind", kind);
    if (category) query = query.eq("category_id", category);
    const term = cleanSearch(q);
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,area.ilike.%${term}%`
      );
    }
    query.then(({ data, error }) => {
      if (error) setError("Could not load listings. Please try again.");
      setRows(data || []);
      setLoading(false);
    });
  }, [q, kind, category, ready]);

  return (
    <main>
      <h1>Contacts &amp; local services</h1>
      <p className="sub">Only approved listings are shown.</p>

      <div className="searchbar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, service or area"
          aria-label="Search listings"
        />
      </div>
      <div className="searchbar">
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Contacts and businesses</option>
          <option value="contact">Important contacts</option>
          <option value="business">Businesses and services</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="meta">Loading...</p>}
      {!loading && !error && rows.length === 0 && (
        <p>
          Nothing found. Try a different word, or{" "}
          <a href="/submit">suggest a listing</a>.
        </p>
      )}

      {rows.map((r) => (
        <div className="card" key={r.id}>
          <h3>{r.title}</h3>
          <div>
            <span className="badge">
              {r.kind === "contact" ? "Contact" : "Business"}
            </span>
            {r.categories?.name && (
              <span className="badge">{r.categories.name}</span>
            )}
            {r.verified_at && <span className="badge">Verified</span>}
          </div>
          {r.description && <p style={{ margin: "8px 0" }}>{r.description}</p>}
          <div className="meta">
            {r.area && <>Area: {r.area} · </>}
            {r.hours && <>Hours: {r.hours} · </>}
            {r.source && <>Source: {r.source} · </>}
            {r.verified_at
              ? `Verified ${r.verified_at}`
              : `Updated ${new Date(r.updated_at).toLocaleDateString("en-IN")}`}
          </div>
          <div className="actions">
            {r.phone && (
              <a className="btn" href={`tel:${r.phone}`}>
                Call {r.phone}
              </a>
            )}
            {r.whatsapp && (
              <a
                className="btn"
                href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
