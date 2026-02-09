import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Anxiety Watch</h1>
      <p style={{ color: "#444", marginBottom: 16 }}>
        Dashboard eventi e questionari.
      </p>

      <Link
        href="/dashboard"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #111",
          textDecoration: "none",
        }}
      >
        Apri Dashboard →
      </Link>
    </main>
  );
}

