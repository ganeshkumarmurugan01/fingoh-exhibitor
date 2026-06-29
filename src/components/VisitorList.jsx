import { useEffect, useState, useMemo } from "react";

const TIER_COLORS = { Hot:"#ef4444", Warm:"#f97316", Cool:"#3b82f6", Cold:"#9ca3af" };
const TIER_BG     = { Hot:"#FEE2E2", Warm:"#FEF3C7", Cool:"#DBEAFE", Cold:"#F1F5F9" };
const TIER_TEXT   = { Hot:"#991B1B", Warm:"#92400E", Cool:"#1E40AF", Cold:"#475569" };
const C = { navy:"#0D1B3E", muted:"#64748B", light:"#F1F5F9", white:"#FFFFFF" };
const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function VisitorList({ eventId, token, refreshKey }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tier, setTier]         = useState("All");
  const [search, setSearch]     = useState("");
  const [sortCol, setSortCol]   = useState("iei_score");
  const [sortDir, setSortDir]   = useState("desc");

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    fetch(`/api/proxy?slug=v1/audience/contacts/${eventId}`, {
      headers: { "x-fingoh-auth": token || "" },
    })
      .then(r => r.json())
      .then(data => { setContacts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [eventId, token, refreshKey]);

  const counts = useMemo(() => 
    ["Hot","Warm","Cool","Cold"].reduce((acc, t) => {
      acc[t] = contacts.filter(c => c.iei_tier === t).length;
      return acc;
    }, {}), [contacts]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (tier !== "All") list = list.filter(c => c.iei_tier === tier);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name||"").toLowerCase().includes(q) ||
        (c.company||"").toLowerCase().includes(q) ||
        (c.designation||"").toLowerCase().includes(q) ||
        (c.email||"").toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [contacts, tier, search, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const exportCSV = () => {
    const headers = ["Name","Email","Company","Designation","City","Country","Pre-event IEI","Onsite IEI","Tier","Onsite Tier","Reg Prob %"];
    const rows = filtered.map(c => [
      c.name||"", c.email||"", c.company||"", c.designation||"",
      c.city||"", c.country||"",
      c.iei_score?.toFixed(1)||"",
      c.onsite_iei_score?.toFixed(1)||"",
      c.iei_tier||"",
      c.onsite_iei_tier||"",
      c.reg_prob != null ? (c.reg_prob*100).toFixed(0)+"%" : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `visitors-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const SortTh = ({ label, col }) => {
    const active = sortCol === col;
    return (
      <th onClick={() => toggleSort(col)}
        style={{ padding:"10px 12px", fontWeight:600, fontSize:11, color: active ? C.navy : C.muted,
          cursor:"pointer", whiteSpace:"nowrap", userSelect:"none",
          borderBottom:"2px solid #E2E8F0", textAlign:"left" }}>
        {label} {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </th>
    );
  };

  return (
    <div style={{ fontFamily: F }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:C.navy }}>Visitor List</div>
          <div style={{ fontSize:12, color:C.muted }}>{contacts.length} contacts · IEI scored</div>
        </div>
        <button onClick={exportCSV}
          style={{ padding:"8px 16px", background:C.navy, color:"white", border:"none", borderRadius:8,
            fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:6 }}>
          ↓ Export CSV
        </button>
      </div>

      {/* Search + tier filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, company, email…"
          style={{ flex:1, minWidth:200, padding:"9px 13px", border:"1.5px solid #E2E8F0",
            borderRadius:9, fontSize:13, fontFamily:F, outline:"none" }}/>
        <div style={{ display:"flex", gap:6 }}>
          {["All","Hot","Warm","Cool","Cold"].map(t => (
            <button key={t} onClick={() => setTier(t)}
              style={{ padding:"6px 12px", borderRadius:99, border:`2px solid ${TIER_COLORS[t]||"#6b7280"}`,
                background: tier===t ? (TIER_COLORS[t]||"#6b7280") : "white",
                color: tier===t ? "white" : (TIER_COLORS[t]||"#6b7280"),
                cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:F }}>
              {t}{t !== "All" ? ` (${counts[t]??0})` : ` (${contacts.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:C.muted }}>Loading visitors…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:C.muted }}>
          {search || tier !== "All" ? "No visitors match your filters." : "No contacts yet. Upload a CSV above."}
        </div>
      ) : (
        <div style={{ overflowX:"auto", borderRadius:12, border:"1px solid #E2E8F0", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead style={{ background:"#F8FAFC" }}>
              <tr>
                <SortTh label="Name" col="name"/>
                <SortTh label="Company" col="company"/>
                <th style={{ padding:"10px 12px", fontWeight:600, fontSize:11, color:C.muted, borderBottom:"2px solid #E2E8F0" }}>Role</th>
                <th style={{ padding:"10px 12px", fontWeight:600, fontSize:11, color:C.muted, borderBottom:"2px solid #E2E8F0" }}>Location</th>
                <SortTh label="Pre-event IEI" col="iei_score"/>
                <SortTh label="Onsite IEI" col="onsite_iei_score"/>
                <th style={{ padding:"10px 12px", fontWeight:600, fontSize:11, color:C.muted, borderBottom:"2px solid #E2E8F0" }}>Tier</th>
                <SortTh label="Reg Prob" col="reg_prob"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ background: i%2===0 ? "white" : "#FAFBFC",
                  borderBottom:"1px solid #F1F5F9" }}
                  onMouseOver={e => e.currentTarget.style.background="#EFF6FF"}
                  onMouseOut={e => e.currentTarget.style.background = i%2===0 ? "white" : "#FAFBFC"}>
                  <td style={{ padding:"10px 12px", fontWeight:600, color:C.navy }}>
                    <div>{c.name||"—"}</div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:400 }}>{c.email||""}</div>
                  </td>
                  <td style={{ padding:"10px 12px", color:C.navy }}>{c.company||"—"}</td>
                  <td style={{ padding:"10px 12px", color:C.muted, fontSize:12 }}>{c.designation||"—"}</td>
                  <td style={{ padding:"10px 12px", color:C.muted, fontSize:12 }}>{[c.city,c.country].filter(Boolean).join(", ")||"—"}</td>
                  <td style={{ padding:"10px 12px", fontWeight:700, color: TIER_COLORS[c.iei_tier]||C.muted }}>
                    {c.iei_score?.toFixed(1)||"—"}
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    {c.onsite_iei_score ? (
                      <span style={{ fontWeight:700, color: TIER_COLORS[c.onsite_iei_tier]||C.muted }}>
                        {c.onsite_iei_score.toFixed(1)}
                        <span style={{ fontSize:10, marginLeft:4, padding:"1px 6px", borderRadius:99,
                          background: TIER_BG[c.onsite_iei_tier]||"#F1F5F9",
                          color: TIER_TEXT[c.onsite_iei_tier]||C.muted, fontWeight:600 }}>
                          {c.onsite_iei_tier}
                        </span>
                      </span>
                    ) : <span style={{ color:"#CBD5E1", fontSize:11 }}>Not logged</span>}
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
                      background: TIER_BG[c.iei_tier]||"#F1F5F9",
                      color: TIER_TEXT[c.iei_tier]||C.muted }}>
                      {c.iei_tier||"—"}
                    </span>
                  </td>
                  <td style={{ padding:"10px 12px", color:C.muted, fontSize:12 }}>
                    {c.reg_prob != null ? (c.reg_prob*100).toFixed(0)+"%" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"10px 16px", background:"#F8FAFC", borderTop:"1px solid #E2E8F0",
            fontSize:11, color:C.muted, display:"flex", justifyContent:"space-between" }}>
            <span>Showing {filtered.length} of {contacts.length} visitors</span>
            <span>{counts.Hot||0} Hot · {counts.Warm||0} Warm · {counts.Cool||0} Cool · {counts.Cold||0} Cold</span>
          </div>
        </div>
      )}
    </div>
  );
}
