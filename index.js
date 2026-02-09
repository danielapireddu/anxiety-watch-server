const express = require("express");
const { Telegraf } = require("telegraf");
const { Pool } = require("pg");

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");

const cors = require("cors");




const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://anxiety-watch-web.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


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

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { telegram_user_id: ... }
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}


// --- Questionnaire: sequential questions
const QUESTIONS = [
    { id: "q1_where", text: "Where were you during the episode?" },
    { id: "q2_what", text: "What were you doing when the anxiety started?" },
    { id: "q3_company", text: "Were you alone?" },
    { id: "q4_symptom", text: "Did you recognize any specific symptoms?" },
    { id: "q5_solution", text: "How did it go away?" },
    { id: "q6_why", text: "Do you know what might have triggered it?" },
    { id: "q7_time", text: "How long did it last (in minutes)?" },
    { id: "q8_intensity", text: "How intense was it on a scale from 1 to 10?" },
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

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 cifre
}

bot.command("login", async (ctx) => {
  const telegramUserId = Number(ctx.from?.id);
  if (!telegramUserId) return;

  const code = genCode();
  const expiresMinutes = 10;

  try {
    // assicura utente in telegram_users
    await pool.query(
      `insert into telegram_users (telegram_user_id, username)
       values ($1, $2)
       on conflict (telegram_user_id)
       do update set username = excluded.username`,
      [telegramUserId, ctx.from.username || null]
    );

    // salva codice (valido 10 minuti)
    await pool.query(
      `insert into login_codes (telegram_user_id, code, expires_at)
       values ($1, $2, now() + ($3 || ' minutes')::interval)`,
      [telegramUserId, code, String(expiresMinutes)]
    );

    await ctx.reply(
      `Ecco il tuo codice di login: ${code}\n` +
      `Valido per ${expiresMinutes} minuti.\n` +
      `Ora vai sul sito e inseriscilo.`
    );
  } catch (e) {
    console.error("LOGIN command error:", e);
    await ctx.reply("Errore tecnico: non riesco a generare il codice. Riprova tra poco.");
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
app.post("/auth/code", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ ok: false, error: "Missing code" });

  try {
    const r = await pool.query(
      `select id, telegram_user_id, expires_at, used_at
       from login_codes
       where code = $1
       order by expires_at desc
       limit 1`,
      [String(code)]
    );

    if (r.rowCount === 0) {
      return res.status(401).json({ ok: false, error: "Invalid code" });
    }

    const row = r.rows[0];

    if (row.used_at) return res.status(401).json({ ok: false, error: "Code already used" });
    if (new Date(row.expires_at) < new Date()) return res.status(401).json({ ok: false, error: "Code expired" });

    await pool.query(`update login_codes set used_at = now() where id = $1`, [row.id]);

    const token = jwt.sign(
      { telegram_user_id: row.telegram_user_id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ ok: true, token, uid: String(row.telegram_user_id) });

  } catch (e) {
    console.error("AUTH CODE error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
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


app.get("/api/my/events", requireAuth, async (req, res) => {
  try {
    const telegramUserId = req.user.telegram_user_id;

    const r = await pool.query(
      `select id, created_at, event_type, device_id, payload
       from events
       where telegram_user_id = $1
       order by created_at desc
       limit 200`,
      [telegramUserId]
    );

    return res.json({ ok: true, events: r.rows });
  } catch (e) {
    console.error("MY EVENTS error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});


// ================================
// AUTH: leggi telegram_user_id dalla sessione
// ================================
// NOTE: qui sotto assumo che tu stia mettendo il telegram_user_id in un header o cookie.
// Per ora facciamo una versione "debug" via querystring, così sblocchiamo subito il sito.
// Poi lo rendiamo sicuro con sessione vera.

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


app.get("/api/my/events/:id", requireAuth, async (req, res) => {
  try {
    const telegramUserId = req.user.telegram_user_id;
    const eventId = req.params.id;

    const ev = await pool.query(
      `select id, created_at, event_type, device_id, payload
       from events
       where id = $1 and telegram_user_id = $2`,
      [eventId, telegramUserId]
    );

    if (ev.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Event not found (or not yours)" });
    }

    const resp = await pool.query(
      `select id, created_at, question_id, answer, meta
       from responses
       where event_id = $1 and telegram_user_id = $2
       order by created_at asc`,
      [eventId, telegramUserId]
    );

    return res.json({ ok: true, event: ev.rows[0], responses: resp.rows });
  } catch (e) {
    console.error("MY EVENT DETAIL error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
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

 


