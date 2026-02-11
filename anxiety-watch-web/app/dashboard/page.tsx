"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type EventRow = {
    id: string;
    created_at: string;
    event_type: string;
    device_id: string;
    payload: any;
    has_questionnaire?: boolean;
    has_device_data?: boolean;
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
    async function deleteEvent(eventId: string) {
        if (!token) return;

        const ok = window.confirm("Delete this event? This cannot be undone.");
        if (!ok) return;

        try {
            setErr(null);

            const apiBase = process.env.NEXT_PUBLIC_API_URL;
            if (!apiBase) {
                setErr("NEXT_PUBLIC_API_URL is missing");
                return;
            }

            const r = await fetch(`${apiBase}/api/my/events/${encodeURIComponent(eventId)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await r.json();

            if (!data.ok) {
                setErr(data.error || "Error while deleting event");
                return;
            }

            // aggiorna subito la UI
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
        } catch {
            setErr("Network error while deleting event");
        }
    }


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

        setEvents((data.events || []) as EventRow[]);;
      } catch {
        setErr("Network error while loading events");
      }
    }
      async function deleteEvent(id: string) {
          if (!token) return;

          const ok = confirm("Delete this event? This cannot be undone.");
          if (!ok) return;

          try {
              const apiBase = process.env.NEXT_PUBLIC_API_URL;
              if (!apiBase) {
                  alert("NEXT_PUBLIC_API_URL is missing");
                  return;
              }

              const r = await fetch(`${apiBase}/api/my/events/${id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
              });

              const data = await r.json();
              if (!data.ok) {
                  alert(data.error || "Delete failed");
                  return;
              }

              setEvents((prev) => prev.filter((x) => x.id !== id));
          } catch {
              alert("Network error");
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
      <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ width: "100%" }}>
          <h1
            style={{
                          fontSize: 46,
                          fontWeight: 850,
                          textAlign: "center",
                          marginBottom: 10,
            }}
          >
            CalmBand
          </h1>

                  <p style={{ textAlign: "center", color: "#444", marginBottom: 6 }}>
               Welcome to your dashboard!
          </p>
                  <p style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", lineHeight: 1.5 }}>
                      Here you can review the history of detected anxiety events, including the physiological data recorded
                      by the device and the related questionnaire responses.
                  </p>

                  <p style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", lineHeight: 1.5 }}>
                      Click <b>Open</b> to access the full details of a single event and review all associated information.
                      If an event does not correspond to a real panic episode, you can remove it safely using <b>Delete</b>.
                  </p>

                  <p style={{ marginTop: 10, fontSize: 13, color: "#666", textAlign: "center" }}>
                      Linked account: <b>{uid}</b>
                  </p>
              </div>

        <Link
          href="/login"
          style={{
              position: "absolute",
              top: 24,
              right: 24,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.2)",
              textDecoration: "none",
              color: "#111",
              background: "white",
              whiteSpace: "nowrap",
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

                                    <span style={chipStyle(ev.has_device_data ? "#e9f7ef" : "#fdecea")}>
                                        Device data: {ev.has_device_data ? "✓" : "✗"}
                                    </span>

                                    <span style={chipStyle(ev.has_questionnaire ? "#e9f7ef" : "#fdecea")}>
                                        Questionnaire: {ev.has_questionnaire ? "✓" : "✗"}
                                    </span>
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
                                    <span style={{ fontWeight: 500 }}>{formatDate(ev.created_at)}</span>
                                </div>

                                {/* Optional (small): event id */}
                                {/* <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>ID: {ev.id}</div> */}
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <Link
                                    href={`/events/${ev.id}`}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #111",
                                        textDecoration: "none",
                                        color: "#111",
                                        background: "white",
                                        whiteSpace: "nowrap",
                                        height: "fit-content",
                                    }}
                                >
                                    Open →
                                </Link>

                                <button
                                    onClick={() => deleteEvent(ev.id)}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        border: "1px solid rgba(220,0,0,0.6)",
                                        background: "white",
                                        color: "crimson",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        height: "fit-content",
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
