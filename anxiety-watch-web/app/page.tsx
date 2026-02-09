import Link from "next/link";

export default function HomePage() {
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

        <p style={{ margin: "0 auto", color: "#444", lineHeight: 1.6, maxWidth: 720 }}>
          A wearable project for early, discreet support during anxiety and panic-related episodes.
        </p>
      </div>

      <div
        style={{
          marginTop: 26,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          padding: 18,
          background: "white",
          lineHeight: 1.65,
          color: "#222",
        }}
      >
        <p style={{ marginTop: 0 }}>
          Hello, we are <b>Daniela</b> and <b>Roberta</b>, students of Bioengineering at the
          University of Genoa. CalmBand is the project we developed for the course{" "}
          <b>Wearable Devices and Interaction</b>.
        </p>

        <p>
          Anxiety and panic episodes are difficult not only because of the event itself, but also
          because of the uncertainty that they may happen again. From a physiological point of view,
          these episodes are often associated with measurable changes such as increased heart rate,
          reduced heart rate variability, and fine tremor.
        </p>

        <p>
          CalmBand does <b>not</b> provide a clinical diagnosis. Its goal is to recognize when the
          body is entering a physiological state compatible with anxiety/panic and to provide early,
          discreet, and continuous support through gentle feedback and breathing guidance.
        </p>

        <p style={{ marginBottom: 0 }}>
          This website is the digital companion of the device: here you can securely access your
          profile, view your recorded events, and review your questionnaire answers over time.
        </p>
      </div>

      <div style={{ marginTop: 22, textAlign: "center" }}>
        <p style={{ marginBottom: 12, color: "#444" }}>
          If you already have our device, click below to log in using your <b>6-digit Telegram code</b>.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #111",
              textDecoration: "none",
              color: "#111",
              background: "white",
              fontWeight: 600,
            }}
          >
            Go to Login →
          </Link>

        
        </div>

        <p style={{ marginTop: 14, fontSize: 13, color: "#666" }}>
          Privacy note: each user can only access their own events and responses.
        </p>
      </div>
    </main>
  );
}
