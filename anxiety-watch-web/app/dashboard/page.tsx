"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type EventRow = {
  id: string;
  created_at: string;
  event_type: string;
  device_id: string;
  payload: any;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function chipStyle(bg: string) {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    background: bg,
    border: "1px solid rgba(0,0,0,0.08)",
  } as const;
}

function humanEventType(type: string) {
  switch (type) {
    case "manual_questionnaire":
      return "Anxiety questionnaire";
    default:
      return type;
  }
}

function humanDevice(device: string) {
  if (device === "manual") return "Manual entry";
  return device;
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("uid");
    setToken(t);
    setUid(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) return;

      try {
        setErr(null);

        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
          setErr("NEXT_PUBLIC_API_URL is missing in .env.local");
          return;
        }

        const r = await fetch(`${apiBase}/api/my/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await r.json();
        if (!data.ok) {
          setErr(data.error || "Error while loading events");
          return;
        }

        setEvents(data.events || []);
      } catch {
        setErr("Network error while loading events");
      }
    }

    load();
  }, [token]);

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (!token || !uid) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: "crimson" }}>
          You are not logged in. Please go to <Link href="/login">/login</Link> first.
        </p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ width: "100%" }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 10,
              width: "100%",
            }}
          >
            CalmBand
          </h1>

          <p style={{ margin: "0 auto", color: "#444", lineHeight: 1.5, maxWidth: 720, textAlign: "center" }}>
            Welcome to your dashboard. Here you can find the history of events where the system detected an anxiety state
            (or a related episode) and, when available, the questionnaire answers.
          </p>

          <p style={{ marginTop: 10, marginBottom: 0, color: "#666", fontSize: 13, textAlign: "center" }}>
            Linked account: <b>{uid}</b>
          </p>
        </div>

        <Link
          href="/login"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.2)",
            textDecoration: "none",
            color: "#111",
            background: "white",
            whiteSpace: "nowrap",
            height: "fit-content",
          }}
        >
          Switch account
        </Link>
      </div>

      {err && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(220,0,0,0.25)",
            color: "crimson",
          }}
        >
          {err}
        </div>
      )}

      <h2 style={{ marginTop: 22, fontSize: 18 }}>Event list</h2>

      {events.length === 0 ? (
        <p style={{ color: "#555" }}>No events found.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 14,
                padding: 14,
                background: "white",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={chipStyle("#f2f2f2")}>{humanEventType(ev.event_type)}</span>
                  <span style={chipStyle("#eef2ff")}>source: {humanDevice(ev.device_id)}</span>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111",
                  }}
                >
                  Date & time:{" "}
                  <span style={{ fontWeight: 500 }}>
                    {formatDate(ev.created_at)}
                  </span>
                </div>

                {/* Optional (small): event id */}
                {/* <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>ID: {ev.id}</div> */}
              </div>

              <Link
                href={`/events/${ev.id}`}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #111",
                  textDecoration: "none",
                  color: "#111",
                  whiteSpace: "nowrap",
                  height: "fit-content",
                }}
              >
                Open →
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
