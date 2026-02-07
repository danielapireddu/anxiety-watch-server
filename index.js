const express = require("express");
const { Telegraf } = require("telegraf");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// ENV (le metterai su Render)
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const WEBHOOK_SECRET_PATH = process.env.WEBHOOK_SECRET_PATH; // es: "telegram-9f3k2"
const PUBLIC_URL = process.env.PUBLIC_URL; // es: https://tuo-servizio.onrender.com

if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN");
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!WEBHOOK_SECRET_PATH) throw new Error("Missing WEBHOOK_SECRET_PATH");
if (!PUBLIC_URL) throw new Error("Missing PUBLIC_URL");

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const bot = new Telegraf(BOT_TOKEN);
console.log("VERSIONE CODICE:", new Date().toISOString(), "commit marker: V2-no-node");


// --- Questionario: domande in sequenza
const QUESTIONS = [
    { id: "q1_dover", text: "Dove ti trovavi durante l'episodio?" },
    { id: "q2_input", text: "Cosa stavi facendo quando è iniziata l’ansia?" },
    { id: "q3_compagnia", text: "Eri solo?" },
    { id: "q4_sintomi", text: "Hai riconsociuto dei sintomi specifici?" },
    { id: "q5_soluzione", text: "Come ti è passato?" },
    { id: "q6_causa", text: "Sai cosa potrebbe averlo scatenato?" },
    { id: "q7_durata", text: "Quanto è durato (in minuti)?" },
    { id: "q8_intensita", text: "Quanta è stata la sua intensità da 1 a 10?" },
];

// Stato in memoria per utente: a che domanda è arrivato + event_id collegato
const userState = new Map();
// telegramUserId -> { step: number, event_id: string|null }

bot.command("questionario", async (ctx) => {
    if (!ctx.from?.id) {
        await ctx.reply("Non riesco a riconoscere l’utente. Prova a scrivere /start e poi /questionario.");
        return;
    }

    const telegramUserId = Number(ctx.from.id);
    const username = ctx.from.username ? String(ctx.from.username) : null;

    try {
        // 1) registra/aggiorna utente
        await pool.query(
            `insert into telegram_users (telegram_user_id, username)
       values ($1, $2)
       on conflict (telegram_user_id)
       do update set username = excluded.username`,
            [telegramUserId, username]
        );

        // 2) crea evento manuale collegato all’utente
        const result = await pool.query(
            `insert into events (device_id, event_type, payload, telegram_user_id)
       values ($1, $2, $3, $4)
       returning id`,
            ["manual", "manual_questionnaire", { source: "telegram", note: "questionario manuale" }, telegramUserId]
        );

        const eventId = result.rows[0].id;

        // 3) inizializza lo stato del questionario
        userState.set(String(telegramUserId), { step: 0, event_id: eventId });

        // 4) invia prima domanda
        await ctx.reply("Ok, iniziamo il questionario.");
        await ctx.reply(QUESTIONS[0].text);

    } catch (e) {
        console.error("QUESTIONARIO error message:", e?.message);
        console.error("QUESTIONARIO error code:", e?.code);
        console.error("QUESTIONARIO error detail:", e?.detail);
        console.error("QUESTIONARIO error full:", e);

        await ctx.reply("Errore tecnico: non riesco a iniziare il questionario. Riprova tra poco.");
    }
});




// --- BOT: /start registra utente
bot.start(async (ctx) => {
    const telegramUserId = Number(ctx.from.id);
 // number va bene
    const username = ctx.from.username || null;

    try {
        await pool.query(
            `insert into telegram_users (telegram_user_id, username)
       values ($1, $2)
       on conflict (telegram_user_id)
       do update set username = excluded.username`,
            [telegramUserId, username]
        );

        await ctx.reply(
            "Ciao! 👋\n\n" +
            "Sono il bot del Questionario Ansia.\n" +
            "Ti farò alcune domande quando verrà rilevato un evento.\n\n" +
            "Sei correttamente collegata ✅"
        );
    } catch (e) {
        console.error("START error:", e);
        await ctx.reply("Errore tecnico durante la registrazione.");
    }
});


function generateCode6() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6 cifre
}

bot.command("login", async (ctx) => {
    if (!ctx.from?.id) return;

    const telegramUserId = Number(ctx.from.id);

    try {
        // genera codice + scadenza 10 minuti
        const code = generateCode6();
        const result = await pool.query(
            `insert into login_codes (telegram_user_id, code, expires_at)
       values ($1, $2, now() + interval '10 minutes')
       returning code, expires_at`,
            [telegramUserId, code]
        );

        await ctx.reply(
            "Codice di accesso (valido 10 minuti):\n\n" +
            result.rows[0].code +
            "\n\nApri il sito e inseriscilo nella pagina /login."
        );
    } catch (e) {
        console.error("LOGIN CODE error:", e);
        await ctx.reply("Errore: non riesco a generare il codice. Riprova tra poco.");
    }
});


// Salva qualunque messaggio testo come risposta “test”
bot.on("text", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const text = ctx.message?.text || "";

    // Ignora i comandi (/start, /questionario, ecc.)
    if (text.startsWith("/")) return;

    // Se l’utente non è in questionario, non fare nulla
    const state = userState.get(telegramUserId);
    if (!state) {
        await ctx.reply("Scrivi /questionario per iniziare.");
        return;
    }


    const q = QUESTIONS[state.step];

    try {
        await pool.query(
            `insert into responses (event_id, telegram_user_id, question_id, answer, meta)
   values ($1, $2, $3, $4, $5)`,
            [
                state.event_id,
                telegramUserId,
                q.id,
                text,
                null
            ]
        );



        state.step += 1;

        if (state.step >= QUESTIONS.length) {
            userState.delete(telegramUserId);
            await ctx.reply("Grazie. Questionario completato ✅");
            return;
        }

        userState.set(telegramUserId, state);
        await ctx.reply(QUESTIONS[state.step].text);
    } catch (e) {
        console.error("DB save error message:", e?.message);
        console.error("DB save error code:", e?.code);
        console.error("DB save error detail:", e?.detail);
        console.error("DB save error full:", e);
        await ctx.reply("Errore nel salvataggio. Riprova a inviare la risposta.");
    }

});


// --- WEBHOOK endpoint (Telegram chiamerà questo URL)
// --- WEBHOOK endpoint (Telegram chiamerà questo URL)
app.post(`/${WEBHOOK_SECRET_PATH}`, async (req, res) => {
    try {
        console.log("Webhook hit:", req.body?.update_id, req.body?.message?.text);
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
    } catch (e) {
        console.error("Webhook error:", e);
        res.sendStatus(500);
    }
});


// --- API: ricevi un evento dall’ESP32 (quando sarà pronto)
app.post("/events", async (req, res) => {
    const { device_id, event_type, payload } = req.body;

    if (!device_id || !event_type || !payload) {
        return res.status(400).json({ error: "Missing device_id, event_type, or payload" });
    }

    const result = await pool.query(
        `insert into events (device_id, event_type, payload)
     values ($1, $2, $3)
     returning id, created_at`,
        [device_id, event_type, payload]
    );

    // Qui in futuro farai partire il questionario legato a event_id
    return res.json({ ok: true, event: result.rows[0] });
});

// health check
app.get("/", (req, res) => res.send("OK"));
app.get("/db-test", async (req, res) => {
    try {
        const r = await pool.query("select now() as now");
        res.json({ ok: true, now: r.rows[0].now });
    } catch (e) {
        console.error("DB TEST error message:", e?.message);
        console.error("DB TEST error code:", e?.code);
        console.error("DB TEST error detail:", e?.detail);
        res.status(500).json({ ok: false, error: e?.message, code: e?.code });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    // setWebhook all'avvio
    const webhookUrl = `${PUBLIC_URL}/${WEBHOOK_SECRET_PATH}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log("Server listening on port", PORT);
    console.log("Webhook set to:", webhookUrl);
});
