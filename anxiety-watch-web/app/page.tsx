"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        fontFamily: "system-ui",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: 42, marginBottom: 12 }}>CalmBand</h1>

      <p style={{ fontSize: 18, color: "#555", marginBottom: 32, textAlign: "center" }}>
        A wearable project for early, discreet support during anxiety and panic-related episodes.
      </p>

      <div
        style={{
          maxWidth: 760,
          lineHeight: 1.6,
          color: "#333",
          background: "#fafafa",
          border: "1px solid #e5e5e5",
          borderRadius: 16,
          padding: 24,
          marginBottom: 40,
        }}
      >
        <p>
          Hello, we are <b>Daniela</b> and <b>Roberta</b>, students of Bioengineering at the
          University of Genoa. CalmBand is the project we developed for the course{" "}
          <b>Wearable Devices and Interaction</b>.
        </p>

        <p>
          Anxiety and panic episodes are difficult not only because of the event itself, but also
          because of the uncertainty that they may happen again. From a physiological point of
          view, these episodes are often associated with measurable changes such as increased heart
          rate, reduced heart rate variability, and fine tremor.
        </p>

        <p>
          CalmBand does <b>not</b> provide a clinical diagnosis. Its goal is to recognize when the
          body is entering a physiological state compatible with anxiety or panic, and to provide
          early, discreet, and continuous support through gentle feedback and breathing guidance.
        </p>

        <p>
          This website is the digital companion of the device. Here you can securely access your
          profile, view your recorded events, and review your questionnaire answers over time.
        </p>
      </div>

      <p style={{ marginBottom: 16 }}>
        If you already have our device, log in using your <b>6-digit Telegram code</b>.
      </p>

      <Link href="/login">
        <button
          style={{
            padding: "12px 24px",
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "white",
          }}
        >
          Go to Login →
        </button>
      </Link>

      <p style={{ marginTop: 24, fontSize: 13, color: "#777" }}>
        Privacy note: each user can only access their own events and responses.
      </p>
    </main>
  );
}
