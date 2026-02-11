
"use client";

import { useEffect, useMemo, useState } from "react";
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

// Question labels (EN) — supporto sia i nomi “vecchi” che quelli “nuovi”
const QUESTION_LABELS: Record<string, string> = {
    // Versione che avevi ora
    q1_dover: "Where were you during the episode?",
    q2_input: "What were you doing when the anxiety started?",
    q3_compagnia: "Were you alone?",
    q4_sintomi: "Did you notice any specific symptoms?",
    q5_soluzione: "How did it pass / how did you cope?",
    q6_causa: "Do you know what might have triggered it?",
    q7_durata: "How long did it last (in minutes)?",
    q8_intensita: "How intense was it (1 to 10)?",

    // Versione che avevi prima in altri file (q1_where, q2_what, ecc.)
    q1_where: "Where were you during the episode?",
    q2_what: "What were you doing when the anxiety started?",
    q3_company: "Were you alone?",
    q4_symptom: "Did you recognize any specific symptoms?",
    q5_solution: "How did it go away?",
    q6_why: "Do you know what might have triggered it?",
    q7_time: "How long did it last (in minutes)?",
    q8_intensity: "How intense was it on a scale from 1 to 10?",
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

// Regola semplice per “device data”: controlla se nel payload ci sono i campi nuovi
function inferHasDeviceData(payload: any): boolean {
    if (!payload || typeof payload !== "object") return false;
    // campi “nuovi” dal tuo Arduino/Python
    if (payload.avg_bpm !== undefined) return true;
    if (payload.avg_hrv !== undefined) return true;
    if (payload.tremor_score !== undefined) return true;
    if (payload.movement_score !== undefined) return true;

    // fallback: i vecchi eventi avevano hr/vibration
    if (payload.hr !== undefined) return true;
    if (payload.vibration !== undefined) return true;

    return false;
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

    const hasQuestionnaire = useMemo(() => responses.length > 0, [responses]);
    const hasDeviceData = useMemo(() => inferHasDeviceData(event?.payload), [event]);

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

            {/* Header */}
            <div style={{ marginTop: 8, textAlign: "center" }}>
                <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>CalmBand</h1>
                <h2 style={{ marginTop: 10, marginBottom: 6, fontSize: 18, fontWeight: 700 }}>Event details</h2>
                <p style={{ margin: "0 auto", color: "#444", lineHeight: 1.5, maxWidth: 720 }}>
                    Here you can review the information related to a single event.
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

                    <span style={chipStyle(hasDeviceData ? "#e9f7ef" : "#fdecea")}>
                        Device data: {hasDeviceData ? "✓" : "✗"}
                    </span>

                    <span style={chipStyle(hasQuestionnaire ? "#e9f7ef" : "#fdecea")}>
                        Questionnaire: {hasQuestionnaire ? "✓" : "✗"}
                    </span>
                </div>

                <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800, color: "#111" }}>
                    Date & time: <span style={{ fontWeight: 600 }}>{formatDateTime(event.created_at)}</span>
                </div>
            </div>

            {/* Payload collapsible */}
            <details style={{ marginTop: 14 }}>
                <summary style={{ cursor: "pointer", color: "#111", fontWeight: 600 }}>Device measurements</summary>

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

            {/* Questionnaire collapsible */}
            <details style={{ marginTop: 14 }} open={false}>
                <summary style={{ cursor: "pointer", color: "#111", fontWeight: 700 }}>
                    Questionnaire answers {hasQuestionnaire ? "" : "(none)"}
                </summary>

                <div style={{ marginTop: 10 }}>
                    {responses.length === 0 ? (
                        <p style={{ color: "#555", marginTop: 0 }}>No answers found for this event.</p>
                    ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                            {responses.map((r) => (
                                <div
                                    key={r.id}
                                    style={{
                                        padding: 10,
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
                                        <b>Answer:</b> {r.answer || "—"}
                                    </div>

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
                </div>
            </details>
        </main>
    );
}
