import Link from "next/link";

export default function HomePage() {
    return (
        <main style={{ padding: 24, fontFamily: "system-ui" }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Anxiety Watch</h1>
            <p>Vai alla dashboard:</p>

            <Link href="/dashboard" style={{ display: "inline-block", marginTop: 12 }}>
                Apri Dashboard →
            </Link>
        </main>
    );
}
