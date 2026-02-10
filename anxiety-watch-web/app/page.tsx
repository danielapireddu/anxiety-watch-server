import Link from "next/link";

export default function HomePage() {
    const telegramBotUrl = "https://t.me/BraccialettoPanico_Bot";

    return (
        <main
            style={{
                minHeight: "100vh",
                padding: "48px 24px",
                fontFamily: "system-ui",
            }}
        >
            <div style={{ maxWidth: 980, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginTop: 10 }}>
                    <h1 style={{ fontSize: 46, fontWeight: 850, marginBottom: 10 }}>
                        CalmBand
                    </h1>

                    <p
                        style={{
                            margin: "0 auto",
                            color: "#444",
                            lineHeight: 1.65,
                            maxWidth: 780,
                            fontSize: 18,
                        }}
                    >
                        Hello, we are <b>Daniela</b> and <b>Roberta</b>, Bioengineering students at the
                        University of Genoa. CalmBand is our project for the course{" "}
                        <b>Wearable Devices and Interaction</b>.
                    </p>
                </div>

                {/* Intro card */}
                <div
                    style={{
                        marginTop: 26,
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 16,
                        padding: 22,
                        background: "white",
                        lineHeight: 1.7,
                        color: "#222",
                    }}
                >
                    <p style={{ marginTop: 0 }}>
                        Anxiety and panic episodes are difficult not only because of the event itself, but also
                        because of the uncertainty that they may happen again.
                    </p>

                    <p>
                        From a physiological point of view, these episodes are often associated with measurable
                        changes such as increased heart rate, reduced heart rate variability, and fine tremor or
                        altered motion patterns.
                    </p>

                    <p>
                        CalmBand does <b>not</b> provide a clinical diagnosis. Its goal is to recognize when the
                        body is entering a physiological state compatible with anxiety/panic and to provide
                        early, discreet support through gentle feedback and breathing guidance.
                    </p>

                    <p style={{ marginBottom: 0 }}>
                        This website is the digital companion of the device: here you can securely access your
                        profile, view your recorded events, and review your questionnaire answers over time.
                    </p>
                </div>

                {/* Two options (two columns) */}
                <div
                    style={{
                        marginTop: 28,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 16,
                    }}
                >
                    {/* First time setup */}
                    <div
                        style={{
                            border: "1px solid rgba(0,0,0,0.10)",
                            borderRadius: 16,
                            padding: 18,
                            background: "#fafafa",
                        }}
                    >
                        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 10 }}>
                            First-time setup (new device)
                        </h2>

                        <p style={{ marginTop: 0, marginBottom: 12, color: "#333", lineHeight: 1.65 }}>
                            Open our Telegram bot and tap <b>Start</b> (or type <b>/start</b>). Follow the
                            instructions to initialize your profile and connect the device. When you need access
                            to the website, generate a login code and then come back here.
                        </p>

                        <a
                            href={telegramBotUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-block",
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: "1px solid rgba(0,0,0,0.20)",
                                textDecoration: "none",
                                color: "#111",
                                background: "white",
                                fontWeight: 650,
                            }}
                        >
                            Open Telegram Bot ↗
                        </a>
                    </div>

                    {/* Already using */}
                    <div
                        style={{
                            border: "1px solid rgba(0,0,0,0.10)",
                            borderRadius: 16,
                            padding: 18,
                            background: "#fafafa",
                        }}
                    >
                        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 10 }}>
                            Already using CalmBand (login)
                        </h2>

                        <p style={{ marginTop: 0, marginBottom: 12, color: "#333", lineHeight: 1.65 }}>
                            In Telegram, type <b>/login</b> to receive a <b>6-digit code</b>. Then open the Login
                            page and enter the code to access your events and responses.
                        </p>

                        <Link
                            href="/login"
                            style={{
                                display: "inline-block",
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: "1px solid #111",
                                textDecoration: "none",
                                color: "#111",
                                background: "white",
                                fontWeight: 650,
                            }}
                        >
                            Go to Login →
                        </Link>
                    </div>
                </div>

                {/* Footer note */}
                <p style={{ marginTop: 18, fontSize: 13, color: "#666", textAlign: "center" }}>
                    Privacy note: each user can only access their own events and responses. The login code is
                    temporary and linked to your Telegram account.
                </p>

                {/* Responsive fallback for narrow screens */}
                <style>{`
          @media (max-width: 820px) {
            .twoCols { grid-template-columns: 1fr !important; }
          }
        `}</style>
            </div>
        </main>
    );
}
