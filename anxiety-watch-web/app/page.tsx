import Link from "next/link";

export default function HomePage() {
    const telegramBotUrl = "https://t.me/BraccialettoPanico_Bot";

    return (
        <main
            style={{
                minHeight: "100vh",
                padding: "16px 24px",
                fontFamily: "system-ui",
            }}
        >
            <div style={{ maxWidth: 980, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginTop: 7 }}>
                    <h1 style={{ fontSize: 46, fontWeight: 850, marginBottom: 10 }}>
                        CalmBand
                    </h1>

                    <p
                        style={{
                            margin: "0 auto",
                            color: "#444",
                            lineHeight: 1.65,
                            maxWidth: 880,
                            fontSize: 18,
                        }}
                    >
                        Hello, we are <b>Daniela Pireddu</b> and <b>Roberta Fumarola</b>, Bioengineering students at the
                        University of Genoa. <b>CalmBand</b> is our project for the course Wearable Devices and Internet of Healthcare Things.
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
                        <b>CalmBand</b>  is a wearable device designed to provide early and discreet support during panic episodes.
                    </p>

                    <p>
                        Our idea is to combine an <b>objective</b>  component, consisting of continuous monitoring of increased heart rate,
                        reduced HRV, and tremor, with a <b>subjective</b> component, collected through user questionnaires on
                        perceived anxiety and symptoms.
                    </p>

                    <p>
                        By integrating physiological data and personal experience, CalmBand aims to detect early signs of panic and
                        provide timely support. It does <b>not replace clinical diagnosis</b>, but enhances awareness and self-management.
                    </p>

                    <p style={{ marginBottom: 0 }}>
                        This website is the <b>digital companion of the device</b>, where you can securely access your profile,
                        view recorded events, and track your questionnaire responses over time.
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
                            <b>First-time setup</b> (new device)
                        </h2>

                        <p style={{ marginTop: 0, marginBottom: 12, color: "#333", lineHeight: 1.65 }}>
                            Open our Telegram bot and type <b>/start</b> to initialize your profile.
                            Once your profile is created, you can return to this page anytime to login and access the website.

                        </p>

                        <a
                            href={telegramBotUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-block",
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: "1px solid #111",
                                textDecoration: "none",
                                color: "#111",
                                background: "white",
                                fontWeight: 650,
                                fontFamily: "system-ui",
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
                            <b>Already using CalmBand</b> (login)
                        </h2>

                        <p style={{ marginTop: 0, marginBottom: 12, color: "#333", lineHeight: 1.65 }}>
                            Open our Telegram bot and type <b>/login</b> to receive a 6-digit code.
                            Then open the login page and enter the code to access your events.

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
                                fontFamily: "system-ui",
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
