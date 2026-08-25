import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";

const C = {
  navy: "#0F172A",
  blue: "#2563EB",
  muted: "#64748B",
  border: "#E2E8F0",
  ltblue: "#EFF6FF",
};

async function fetchCategories(level, parentId = null) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";
  let url = `/api/proxy?slug=v1/categories?industry=pharma&level=${level}`;
  if (parentId) url += `&parent_id=${parentId}`;
  const res = await fetch(url, {
    headers: { "x-fingoh-auth": `Bearer ${token}` },
  });
  return res.ok ? res.json() : [];
}

export default function CategoryPicker({ selected = [], onChange, industry = "pharma" }) {
  const [l1, setL1]             = useState([]);
  const [l2, setL2]             = useState([]);
  const [l3, setL3]             = useState([]);
  const [selL1, setSelL1]       = useState(null);
  const [selL2, setSelL2]       = useState(null);
  const [search, setSearch]     = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom]   = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchCategories(1).then(data => { setL1(data); setLoading(false); });
  }, [industry]);

  useEffect(() => {
    if (!selL1) { setL2([]); setL3([]); setSelL2(null); return; }
    fetchCategories(2, selL1.id).then(setL2);
    setL3([]); setSelL2(null);
  }, [selL1]);

  useEffect(() => {
    if (!selL2) { setL3([]); return; }
    fetchCategories(3, selL2.id).then(setL3);
  }, [selL2]);

  const toggle = (cat) => {
    const key = cat.id;
    const isSelected = selected.some(s => s.id === key);
    if (isSelected) {
      onChange(selected.filter(s => s.id !== key));
    } else {
      onChange([...selected, { id: cat.id, name: cat.name, code: cat.code, level: cat.level }]);
    }
  };

  const addCustom = async () => {
    if (!customInput.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    const tok = session?.access_token || "";
    const res = await fetch(`/api/proxy?slug=v1/categories/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fingoh-auth": `Bearer ${tok}` },
      body: JSON.stringify({
        industry,
        name: customInput.trim(),
        parent_id: selL2?.id || selL1?.id || null,
        level: selL2 ? 3 : selL1 ? 2 : 1,
      }),
    });
    if (res.ok) {
      const newCat = await res.json();
      onChange([...selected, { id: newCat.id, name: newCat.name, code: null, level: newCat.level }]);
      setCustomInput("");
      setShowCustom(false);
      // Refresh the relevant level
      if (selL2) fetchCategories(3, selL2.id).then(setL3);
      else if (selL1) fetchCategories(2, selL1.id).then(setL2);
    }
  };

  const filteredL1 = search ? l1.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : l1;
  const filteredL2 = search ? l2.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : l2;
  const filteredL3 = search ? l3.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : l3;

  if (loading) return <div style={{ fontSize: 12, color: C.muted }}>Loading categories…</div>;

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Selected tags */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {selected.map(s => (
            <span key={s.id} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 99,
              background: C.ltblue, color: C.blue, border: `1px solid #BFDBFE`,
              fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
            }}>
              {s.name}
              <button onClick={() => toggle(s)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.blue, fontSize: 12, padding: 0, lineHeight: 1,
              }}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search categories…"
        style={{
          width: "100%", padding: "7px 10px", borderRadius: 6,
          border: `1px solid ${C.border}`, fontSize: 12,
          boxSizing: "border-box", marginBottom: 10,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxHeight: 260, overflow: "auto" }}>
        {/* L1 */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", background: "#F8FAFC", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>
            Category
          </div>
          {filteredL1.map(c => (
            <div key={c.id}
              onClick={() => setSelL1(selL1?.id === c.id ? null : c)}
              title={c.description || ""}
              style={{
                padding: "7px 10px", fontSize: 12, cursor: "pointer",
                background: selL1?.id === c.id ? C.ltblue : "white",
                color: selL1?.id === c.id ? C.blue : C.navy,
                fontWeight: selL1?.id === c.id ? 700 : 400,
                borderBottom: `1px solid ${C.border}`,
              }}>
              {c.name}
            </div>
          ))}
        </div>

        {/* L2 */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", background: "#F8FAFC", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>
            Sub-category
          </div>
          {!selL1 && !search ? (
            <div style={{ padding: "10px", fontSize: 11, color: C.muted }}>← Select a category</div>
          ) : filteredL2.map(c => (
            <div key={c.id}
              onClick={() => setSelL2(selL2?.id === c.id ? null : c)}
              title={c.description || ""}
              style={{
                padding: "7px 10px", fontSize: 12, cursor: "pointer",
                background: selL2?.id === c.id ? C.ltblue : selected.some(s => s.id === c.id) ? "#F0FDF4" : "white",
                color: selL2?.id === c.id ? C.blue : C.navy,
                fontWeight: selL2?.id === c.id ? 700 : 400,
                borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
              <span>{c.name}</span>
              <button onClick={e => { e.stopPropagation(); toggle(c); }}
                style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 99,
                  border: `1px solid ${selected.some(s => s.id === c.id) ? "#86EFAC" : C.border}`,
                  background: selected.some(s => s.id === c.id) ? "#F0FDF4" : "white",
                  color: selected.some(s => s.id === c.id) ? "#16A34A" : C.muted,
                  cursor: "pointer", fontWeight: 600,
                }}>
                {selected.some(s => s.id === c.id) ? "✓" : "+"}
              </button>
            </div>
          ))}
        </div>

        {/* L3 */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", background: "#F8FAFC", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>
            Specific
          </div>
          {!selL2 && !search ? (
            <div style={{ padding: "10px", fontSize: 11, color: C.muted }}>← Select a sub-category</div>
          ) : filteredL3.map(c => (
            <div key={c.id}
              onClick={() => toggle(c)}
              style={{
                padding: "7px 10px", fontSize: 11, cursor: "pointer",
                background: selected.some(s => s.id === c.id) ? "#F0FDF4" : "white",
                color: selected.some(s => s.id === c.id) ? "#16A34A" : C.navy,
                fontWeight: selected.some(s => s.id === c.id) ? 700 : 400,
                borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between",
              }}>
              <span>{c.name}</span>
              {selected.some(s => s.id === c.id) && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Add custom */}
      <div style={{ marginTop: 8 }}>
        {showCustom ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustom()}
              placeholder={`Custom category name${selL2 ? " under " + selL2.name : selL1 ? " under " + selL1.name : ""}…`}
              style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12 }}
              autoFocus
            />
            <button onClick={addCustom} style={{ padding: "6px 12px", background: C.navy, color: "white", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Add</button>
            <button onClick={() => setShowCustom(false)} style={{ padding: "6px 12px", background: "white", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowCustom(true)} style={{ fontSize: 11, color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            + Add custom category
          </button>
        )}
      </div>
    </div>
  );
}
