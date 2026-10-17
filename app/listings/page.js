"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";
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
    <div className="page">
      <PageHeader title="Contacts & services" ml="ലിസ്റ്റിംഗുകൾ">
        <form onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="q" className="hp">Search</label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, service or area"
            aria-label="Search listings"
          />
        </form>
      </PageHeader>
      <main className="body">
        <div style={{ display: "flex", gap: 10 }}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ flex: 1 }}>
            <option value="">All kinds</option>
            <option value="contact">Important contacts</option>
            <option value="business">Businesses and services</option>
            <option value="worker">Native workers</option>
            <option value="transport">Transportation</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: 1 }}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Loading...</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="muted">
            Nothing found. Try a different word, or{" "}
            <Link href="/share" style={{ textDecoration: "underline", color: "var(--primary)" }}>share information</Link>.
          </p>
        )}

        {rows.map((r) => (
          <div className="card" key={r.id}>
            <div className="cardhead">
              <div>
                <h3>{r.title}</h3>
                <p className="muted">{[r.categories?.name, r.area].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="pill">
                {r.kind === "contact"
                  ? "Contact"
                  : r.kind === "worker"
                  ? "Worker"
                  : r.kind === "transport"
                  ? "Transport"
                  : "Business"}
              </span>
            </div>
            {r.description && <p style={{ margin: "4px 0" }}>{r.description}</p>}
            <p className="muted small">
              {r.hours && `Hours: ${r.hours} · `}
              {r.verified_at
                ? `Verified ${new Date(r.verified_at).toLocaleDateString("en-IN")}`
                : `Updated ${new Date(r.updated_at).toLocaleDateString("en-IN")}`}
            </p>
            <div className="btnrow" style={{ marginTop: 6 }}>
              {r.phone && (
                <a className="btn dark" href={`tel:${r.phone}`}>
                  Call {r.phone}
                </a>
              )}
              {r.whatsapp && (
                <a
                  className="btn light"
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
    </div>
  );
}
