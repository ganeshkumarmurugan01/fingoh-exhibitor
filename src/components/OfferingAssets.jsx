import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";

const ASSET_RULES = {
  photo:    { label: "Photos",   accept: "image/jpeg,image/png,image/webp", maxCount: 5,  maxMB: 5,  icon: "🖼️" },
  video:    { label: "Video",    accept: "video/mp4,video/quicktime",        maxCount: 1,  maxMB: 50, icon: "🎬" },
  brochure: { label: "Brochure", accept: "application/pdf",                  maxCount: 1,  maxMB: 10, icon: "📄" },
};

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || "";
}

export default function OfferingAssets({ offeringId, eventId }) {
  const [assets, setAssets]       = useState({ photo: [], video: [], brochure: [] });
  const [uploading, setUploading] = useState({});
  const [error, setError]         = useState(null);
  const [open, setOpen]           = useState(false);
  const photoRef    = useRef();
  const videoRef    = useRef();
  const brochureRef = useRef();
  const fileRefs    = { photo: photoRef, video: videoRef, brochure: brochureRef };

  useEffect(() => {
    if (open && offeringId) fetchAssets();
  }, [open, offeringId]);

  async function fetchAssets() {
    try {
      const res  = await fetch(`/api/proxy?slug=v1/products/${offeringId}/assets`, {
        headers: { "x-fingoh-auth": `Bearer ${await getToken()}` },
      });
      const data = await res.json();
      const grouped = { photo: [], video: [], brochure: [] };
      (data || []).forEach(a => grouped[a.asset_type]?.push(a));
      setAssets(grouped);
    } catch (e) {
      setError("Failed to load assets");
    }
  }

  async function handleUpload(assetType, file) {
    if (!file) return;
    setError(null);
    setUploading(u => ({ ...u, [assetType]: true }));

    const form = new FormData();
    form.append("file", file);
    form.append("offering_id", offeringId);
    form.append("event_id", eventId);
    form.append("asset_type", assetType);

    try {
      const res = await fetch("/api/upload?slug=v1/products/upload-asset", {
        method: "POST",
        headers: { "x-fingoh-auth": `Bearer ${await getToken()}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      await fetchAssets();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(u => ({ ...u, [assetType]: false }));
    }
  }

  async function handleDelete(assetId) {
    if (!confirm("Delete this file?")) return;
    setError(null);
    try {
      await fetch(`/api/proxy?slug=v1/products/asset/${assetId}`, {
        method: "DELETE",
        headers: { "x-fingoh-auth": `Bearer ${await getToken()}` },
      });
      await fetchAssets();
    } catch (e) {
      setError("Delete failed");
    }
  }

  const totalCount = Object.values(assets).flat().length;

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "#6b7280", padding: 0,
        }}
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>Product Files</span>
        {totalCount > 0 && (
          <span style={{
            background: "#eff6ff", color: "#2563eb",
            borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 600,
          }}>
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}>
              {error}
            </div>
          )}

          {Object.entries(ASSET_RULES).map(([type, rules]) => {
            const list     = assets[type] || [];
            const canAdd   = list.length < rules.maxCount;
            const isUploading = uploading[type];

            return (
              <div key={type}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {rules.icon} {rules.label}
                    <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                      ({list.length}/{rules.maxCount}) · max {rules.maxMB}MB
                    </span>
                  </span>
                  {canAdd && (
                    <>
                      <input
                        ref={fileRefs[type]}
                        type="file"
                        accept={rules.accept}
                        style={{ display: "none" }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(type, f);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileRefs[type].current?.click()}
                        disabled={isUploading}
                        style={{
                          fontSize: 12, padding: "3px 10px",
                          border: "1px solid #d1d5db", borderRadius: 5,
                          background: isUploading ? "#f3f4f6" : "#fff",
                          cursor: isUploading ? "not-allowed" : "pointer",
                          color: "#374151",
                        }}
                      >
                        {isUploading ? "Uploading…" : "+ Add"}
                      </button>
                    </>
                  )}
                </div>

                {/* File list */}
                {list.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No {rules.label.toLowerCase()} uploaded</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {list.map(asset => (
                      <AssetThumb key={asset.id} asset={asset} onDelete={() => handleDelete(asset.id)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssetThumb({ asset, onDelete }) {
  const isPhoto = asset.asset_type === "photo";
  return (
    <div style={{
      position: "relative", border: "1px solid #e5e7eb", borderRadius: 6,
      overflow: "hidden", background: "#f9fafb",
      width: isPhoto ? 72 : "auto", minWidth: isPhoto ? 72 : 140,
    }}>
      {isPhoto ? (
        <img
          src={asset.public_url}
          alt={asset.file_name}
          style={{ width: 72, height: 72, objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>{asset.asset_type === "video" ? "🎬" : "📄"}</span>
          <span style={{
            fontSize: 11, color: "#374151", maxWidth: 120,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {asset.file_name}
          </span>
        </div>
      )}
      <button
        onClick={onDelete}
        title="Delete"
        style={{
          position: "absolute", top: 2, right: 2,
          background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
          color: "#fff", width: 18, height: 18, fontSize: 10,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1, padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}