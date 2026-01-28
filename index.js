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

// --- BOT: /start registra utente
bot.start(async (ctx) => {
    await ctx.reply(
        "Ciao! 👋\n\n" +
        "Sono il bot del Questionario Ansia.\n" +
        "Ti farò alcune domande quando verrà rilevato un evento.\n\n" +
        "Per ora sei correttamente collegata ✅"
    );
});

// --- BOT: /test avvia un mini questionario finto
bot.command("test", async (ctx) => {
    await ctx.reply("Questionario test: come ti senti adesso? (rispondi con una parola)");
});

// Salva qualunque messaggio testo come risposta “test”
bot.on("text", async (ctx) => {
    const text = ctx.message?.text || "";
    if (text.startsWith("/")) return;  // ignora i comandi tipo /start


    // Qui, per ora, non leghiamo a un event_id reale
    await pool.query(
        `insert into responses (event_id, telegram_user_id, question_id, answer)
     values (null, $1, $2, $3)`,
        [tgId, "free_text_test", answer]
    );

    await ctx.reply("Risposta salvata. Grazie!");
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
