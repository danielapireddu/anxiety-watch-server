"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type EventRow = {
  id: string;
  created_at: string;
  event_type: string;
  device_id: string;
  payload: any;
};

type ResponseRow = {
  id: string;
  created_at: string;
  question_id: string;
  answer: string;
  meta: any;
};

// Question labels (EN)
const QUESTION_LABELS: Record<string, string> = {
  q1_dover: "Where were you during the episode?",
  q2_input: "What were you doing when the anxiety started?",
  q3_compagnia: "Were you alone?",
  q4_sintomi: "Did you notice any specific symptoms?",
  q5_soluzione: "How did it pass / how did you cope?",
  q6_causa: "Do you know what might have triggered it?",
  q7_durata: "How long did it last (in minutes)?",
  q8_intensita: "How intense was it (1 to 10)?",
};

function formatDateTime(iso: string) {
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

// render values safely
function formatValue(v: any) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [token, setToken] = useState<string | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) return;

      try {
        setErr(null);
        setLoading(true);

        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
          setErr("NEXT_PUBLIC_API_URL is missing in .env.local");
          return;
        }

        const r = await fetch(`${apiBase}/api/my/events/${encodeURIComponent(eventId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await r.json();
        if (!data.ok) {
          setErr(data.error || "Error while loading event details");
          return;
        }

        setEvent(data.event);
        setResponses(data.responses || []);
      } catch {
        setErr("Network error while loading event details");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, eventId]);

  if (!token) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>Event</h1>
        <p style={{ color: "crimson" }}>
          You are not logged in. Please go to <Link href="/login">/login</Link>.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (err) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: "crimson" }}>{err}</p>
        <p style={{ marginTop: 10 }}>
          <Link href="/dashboard">← Back to dashboard</Link>
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <p>Event not found.</p>
        <p style={{ marginTop: 10 }}>
          <Link href="/dashboard">← Back to dashboard</Link>
        </p>
      </main>
    );
  }

  const payloadEntries =
    event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? Object.entries(event.payload)
      : null;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/dashboard">← Back to dashboard</Link>
      </p>

      {/* Header (same vibe as dashboard) */}
      <div style={{ marginTop: 8, textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>CalmBand</h1>
        <h2 style={{ marginTop: 10, marginBottom: 6, fontSize: 18, fontWeight: 700 }}>
          Event details
        </h2>
        <p style={{ margin: "0 auto", color: "#444", lineHeight: 1.5, maxWidth: 720 }}>
          Here you can review the information related to a single event, including (when available) the
          questionnaire answers.
        </p>
      </div>

      {/* Key info card */}
      <div
        style={{
          marginTop: 18,
          padding: 14,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          background: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={chipStyle("#f2f2f2")}>{humanEventType(event.event_type)}</span>
          <span style={chipStyle("#eef2ff")}>source: {humanDevice(event.device_id)}</span>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 16,
            fontWeight: 800,
            color: "#111",
          }}
        >
          Date & time:{" "}
          <span style={{ fontWeight: 600 }}>{formatDateTime(event.created_at)}</span>
        </div>

        {/* Event ID hidden by default (debug only) */}
        {/* <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>Event ID: {event.id}</div> */}
      </div>

      {/* Payload not too prominent (collapsible) */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", color: "#111", fontWeight: 600 }}>
          Technical details (payload)
        </summary>

        <div
          style={{
            marginTop: 10,
            padding: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 14,
            background: "white",
          }}
        >
          {payloadEntries ? (
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 8 }}>
              {payloadEntries.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <div style={{ fontWeight: 700, color: "#222" }}>{k}</div>
                  <div style={{ color: "#333", wordBreak: "break-word" }}>{formatValue(v)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#333", wordBreak: "break-word" }}>{formatValue(event.payload)}</div>
          )}

          {/* Full JSON only if you want (still collapsible) */}
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: "pointer" }}>Show full JSON (debug)</summary>
            <pre
              style={{
                marginTop: 8,
                background: "#f6f6f6",
                padding: 10,
                borderRadius: 10,
                overflow: "auto",
                fontSize: 12,
              }}
            >
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </details>
        </div>
      </details>

      {/* Responses */}
      <h2 style={{ marginTop: 18, fontSize: 18 }}>Questionnaire answers</h2>

      {responses.length === 0 ? (
        <p style={{ color: "#555" }}>No answers found for this event.</p>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {responses.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 10, // tighter
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 14,
                background: "white",
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>
                {formatDateTime(r.created_at)} • {r.question_id}
              </div>

             
              <div style={{ marginTop: 4, fontSize: 14, color: "#222" }}>
  {QUESTION_LABELS[r.question_id] ?? r.question_id}
</div>

<div style={{ marginTop: 2, fontSize: 14, color: "#222" }}>
  Answer: {r.answer || "—"}
</div>


              {/* Meta hidden by default */}
              {r.meta && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ cursor: "pointer", fontSize: 12 }}>Show meta (debug)</summary>
                  <pre
                    style={{
                      marginTop: 6,
                      background: "#f6f6f6",
                      padding: 10,
                      borderRadius: 10,
                      overflow: "auto",
                      fontSize: 12,
                    }}
                  >
                    {JSON.stringify(r.meta, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
