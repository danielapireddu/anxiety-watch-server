"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const r = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await r.json();
      if (!data.ok) {
        setErr(data.error || "Errore login");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setErr("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 480 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Login</h1>

      <p>
        1) Scrivi al bot <b>/login</b><br />
        2) Inserisci qui il codice
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Codice (6 cifre)"
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #333" }}
        >
          {loading ? "Accesso..." : "Accedi"}
        </button>

        {err && <p style={{ marginTop: 12, color: "crimson" }}>{err}</p>}
      </form>
    </main>
  );
}
