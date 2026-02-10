"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Se esistono token+uid, significa che (probabilmente) sei già loggata
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("uid");
    setHasSession(Boolean(t && u));
  }, []);

  return (
    <main
      style={{
        fontFamily: "system-ui",
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 10 }}>
          CalmBand
        </h1>

        <p style={{ margin: "0 auto", color: "#444", lineHeight: 1.6, maxWidth: 720, fontSize: 16 }}>
          CalmBand is a wearable companion for anxiety and panic awareness. It does not provide a medical diagnosis,
          but it helps you recognize early physiological signs (such as changes in heart rate, heart rate variability,
          and tremor/motion patterns) and offers discreet breathing guidance.
        </p>

        <p style={{ margin: "14px auto 0", color: "#555", lineHeight: 1.6, maxWidth: 720, fontSize: 15 }}>
          This website is your personal diary: you can view recorded events and, when available, your questionnaire answers.
        </p>

        <div
          style={{
            marginTop: 26,
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/login"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.25)",
              textDecoration: "none",
              color: "#111",
              background: "white",
              fontWeight: 600,
            }}
          >
            Go to Login →
          </Link>

          <a
            href="https://t.me/BraccialettoPanico_Bot"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.25)",
              textDecoration: "none",
              color: "#111",
              background: "white",
              fontWeight: 600,
            }}
          >
            Open Telegram Bot ↗
          </a>

          {hasSession && (
            <Link
              href="/dashboard"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #111",
                textDecoration: "none",
                color: "white",
                background: "#111",
                fontWeight: 700,
              }}
            >
              Open Dashboard →
            </Link>
          )}
        </div>

        <div style={{ marginTop: 34, textAlign: "left" }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>First-time setup (new device)</h2>
          <ol style={{ marginTop: 0, color: "#444", lineHeight: 1.7 }}>
            <li>Open the Telegram bot and tap <b>Start</b> (or type <b>/start</b>).</li>
            <li>Follow the instructions to initialize your profile and connect the device.</li>
            <li>When needed, generate a login code and then come back here to log in.</li>
          </ol>

          <h2 style={{ fontSize: 18, marginTop: 22, marginBottom: 10 }}>Already using CalmBand (login)</h2>
          <ol style={{ marginTop: 0, color: "#444", lineHeight: 1.7 }}>
            <li>In Telegram, type <b>/login</b> to receive a <b>6-digit code</b>.</li>
            <li>Go to the Login page and enter the code.</li>
          </ol>

          <p style={{ marginTop: 18, color: "#555", lineHeight: 1.6 }}>
            <b>Privacy note:</b> Each user can access only their own events. The login code is temporary and linked to your Telegram account.
          </p>
        </div>
      </div>
    </main>
  );
}
