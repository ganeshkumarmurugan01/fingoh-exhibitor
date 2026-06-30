import { useState } from "react";

export default function AudienceUpload({ eventId, token, onUploaded }) {
  const [file, setFile]     = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/v1/audience/upload/${eventId}`, {
        method: "POST",
        headers: { "x-fingoh-auth": token },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setStatus("done");
      onUploaded?.();
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <h3 style={{ marginBottom: "0.75rem" }}>Upload Audience CSV</h3>
      <input
        type="file"
        accept=".csv"
        onChange={e => { setFile(e.target.files[0]); setStatus("idle"); }}
        style={{ marginBottom: "0.75rem", display: "block" }}
      />
      <button
        onClick={handleUpload}
        disabled={!file || status === "uploading"}
        style={{
          padding: "0.5rem 1.25rem",
          background: status === "uploading" ? "#9ca3af" : "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: !file || status === "uploading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "uploading" ? "Scoring…" : "Upload & Score"}
      </button>

      {status === "done" && (
        <p style={{ marginTop: "0.75rem", color: "#16a34a" }}>
          ✅ {result.uploaded} contacts scored and saved.
        </p>
      )}
      {status === "error" && (
        <p style={{ marginTop: "0.75rem", color: "#dc2626" }}>
          ❌ Upload failed — check console for details.
        </p>
      )}
    </div>
  );
}