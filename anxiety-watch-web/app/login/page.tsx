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
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase) {
        setErr("Missing NEXT_PUBLIC_API_URL in .env.local");
        return;
      }

      const r = await fetch(`${apiBase}/auth/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await r.json();

      if (!data.ok) {
        setErr(data.error || "Login error");
        return;
      }

      // Save session
      localStorage.setItem("token", data.token);
      localStorage.setItem("uid", String(data.uid));

      router.push("/dashboard");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "system-ui",
        background: "white",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontSize: 46, fontWeight: 850, margin: 0 }}>CalmBand</h1>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 10, marginBottom: 18, color: "#333" }}>
          Login page
        </h2>

        <p style={{ margin: "0 auto", color: "#444", lineHeight: 1.55, maxWidth: 460 }}>
          To protect your privacy, each user can only access their own events and questionnaire data.
          This login process links your web session to your Telegram account.
        </p>

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.12)",
            textAlign: "left",
            background: "white",
          }}
        >
          <div style={{ fontSize: 16, color: "#222", lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>
              <b>Step 1.</b> Open Telegram, go to the bot, and type <b>/login</b>
            </div>
            <div>
              <b>Step 2.</b> Paste here the 6-digit code the bot sends you
            </div>
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.2)",
                fontSize: 16,
                outline: "none",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #111",
                background: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16,
                width: "fit-content",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {err && <p style={{ marginTop: 12, color: "crimson" }}>{err}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}
