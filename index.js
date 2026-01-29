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

// --- Questionario: domande in sequenza
const QUESTIONS = [
    { id: "q1_trigger", text: "Cosa stavi facendo quando è iniziata l’ansia?" },
    { id: "q2_intensity", text: "Quanto era intensa (0-10)?" },
    { id: "q3_duration", text: "Quanto è durata circa (minuti)?" },
];

// Stato in memoria per utente: a che domanda è arrivato + event_id collegato
const userState = new Map();
// telegramUserId -> { step: number, event_id: string|null }

bot.command("questionario", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);

    // Per ora non abbiamo un vero event_id (lo collegheremo nella fase ESP32)
    userState.set(telegramUserId, { step: 0, event_id: null });

    await ctx.reply("Ok, iniziamo il questionario.");
    await ctx.reply(QUESTIONS[0].text);
});

// --- BOT: /start registra utente
bot.start(async (ctx) => {
    await ctx.reply(
        "Ciao! 👋\n\n" +
        "Sono il bot del Questionario Ansia.\n" +
        "Ti farò alcune domande quando verrà rilevato un evento.\n\n" +
        "Per ora sei correttamente collegata ✅"
    );
});

// Salva qualunque messaggio testo come risposta “test”
bot.on("text", async (ctx) => {
    const telegramUserId = String(ctx.from?.id);
    const text = ctx.message?.text || "";

    // Ignora i comandi (/start, /questionario, ecc.)
    if (text.startsWith("/")) return;

    // Se l’utente non è in questionario, non fare nulla
    const state = userState.get(telegramUserId);
    if (!state) return;

    const q = QUESTIONS[state.step];

    try {
        await pool.query(
            `insert into responses (event_id, telegram_user_id, question_id, answer, meta)
       values ($1, $2, $3, $4, $5)`,
            [
                state.event_id,          // per ora null
                telegramUserId,
                q.id,
                text,
                null                     // per ora meta null (poi ci metteremo HR/IMU)
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
        console.error("DB save error:", e);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    // setWebhook all'avvio
    const webhookUrl = `${PUBLIC_URL}/${WEBHOOK_SECRET_PATH}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log("Server listening on port", PORT);
    console.log("Webhook set to:", webhookUrl);
});
