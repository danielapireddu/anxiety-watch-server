const express = require("express");
const { Telegraf } = require("telegraf");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

// =====================
// ENV
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const WEBHOOK_SECRET_PATH = process.env.WEBHOOK_SECRET_PATH;
const PUBLIC_URL = process.env.PUBLIC_URL;

const JWT_SECRET = process.env.JWT_SECRET;

if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN");
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!WEBHOOK_SECRET_PATH) throw new Error("Missing WEBHOOK_SECRET_PATH");
if (!PUBLIC_URL) throw new Error("Missing PUBLIC_URL");
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");

// =====================
// CORS
// =====================
const allowedOrigins = [
    "http://localhost:3000",
    "https://anxiety-watch-web.onrender.com",
    "https://calmbanddr.vercel.app",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            if (origin.endsWith(".vercel.app")) return callback(null, true);
            return callback(new Error("Not allowed by CORS: " + origin));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

// =====================
// DB + BOT
// =====================
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const bot = new Telegraf(BOT_TOKEN);

console.log("SERVER START:", new Date().toISOString());

// =====================
// Helpers
// =====================
async function upsertTelegramUserFromCtx(ctx) {
    if (!ctx.from?.id) return;

    const telegramUserId = Number(ctx.from.id);
    const username = ctx.from.username || null;
    const chatId = ctx.chat?.id ? Number(ctx.chat.id) : null;

    // se chatId è null, non sovrascriviamo un chat_id già valido
    await pool.query(
        `insert into telegram_users (telegram_user_id, username, chat_id)
     values ($1, $2, $3)
     on conflict (telegram_user_id)
     do update set username = excluded.username,
                  chat_id = coalesce(excluded.chat_id, telegram_users.chat_id)`,
        [telegramUserId, username, chatId]
    );
}

function requireAuth(req, res, next) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // { telegram_user_id: ... }
        return next();
    } catch {
        return res.status(401).json({ ok: false, error: "Invalid token" });
    }
}

// =====================
// Questionnaire questions
// =====================
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

// =====================
// Notify questionnaire ready (uses chat_id!)
// =====================
async function notifyQuestionnaireReady(telegramUserId, eventId) {
    // 1) ensure session row
    // Se hai UNIQUE(telegram_user_id, event_id) va bene
    await pool.query(
        `insert into questionnaire_sessions (telegram_user_id, event_id, step, status, updated_at)
     values ($1, $2, 0, 'pending', now())
     on conflict (telegram_user_id, event_id)
     do update set status='pending', step=0, updated_at=now()`,
        [telegramUserId, eventId]
    );

    // 2) get chat_id
    const u = await pool.query(
        `select chat_id from telegram_users where telegram_user_id=$1`,
        [telegramUserId]
    );

    if (u.rowCount === 0 || !u.rows[0].chat_id) {
        return { ok: false, warning: "User has no chat_id" };
    }

    const chatId = Number(u.rows[0].chat_id);

    // 3) send message with inline buttons
    await bot.telegram.sendMessage(
        chatId,
        "CalmBand recorded an event.\nWhen you feel ready, you can start the short questionnaire.",
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Start questionnaire", callback_data: `start_q:${eventId}` }],
                    [{ text: "Not now", callback_data: `dismiss_q:${eventId}` }],
                ],
            },
        }
    );

    return { ok: true };
}

// =====================
// BOT commands
// =====================
bot.start(async (ctx) => {
    try {
        await upsertTelegramUserFromCtx(ctx);
        await ctx.reply("Hi! ✅ CalmBand bot is connected.");
    } catch (e) {
        console.error("START error:", e);
        await ctx.reply("Technical error during registration.");
    }
});

function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

bot.command("login", async (ctx) => {
    try {
        await upsertTelegramUserFromCtx(ctx);

        const telegramUserId = Number(ctx.from?.id);
        if (!telegramUserId) return;

        const code = genCode();
        const expiresMinutes = 10;

        await pool.query(
            `insert into login_codes (telegram_user_id, code, expires_at)
       values ($1, $2, now() + ($3 || ' minutes')::interval)`,
            [telegramUserId, code, String(expiresMinutes)]
        );

        await ctx.reply(
            `Your login code: ${code}\nValid for ${expiresMinutes} minutes.\nGo to the website and enter it.`
        );
    } catch (e) {
        console.error("LOGIN command error:", e);
        await ctx.reply("Technical error: cannot generate code right now.");
    }
});

// Manual questionnaire trigger (optional)
bot.command("questionario", async (ctx) => {
    try {
        await upsertTelegramUserFromCtx(ctx);

        const telegramUserId = Number(ctx.from?.id);
        if (!telegramUserId) return;

        // create manual event
        const result = await pool.query(
            `insert into events (device_id, event_type, payload, telegram_user_id)
       values ($1, $2, $3, $4)
       returning id`,
            ["manual", "manual_questionnaire", { source: "telegram" }, telegramUserId]
        );

        const eventId = result.rows[0].id;

        // send the "ready" message with button
        const n = await notifyQuestionnaireReady(telegramUserId, eventId);
        if (!n.ok) {
            await ctx.reply("I created the event, but I cannot message you yet. Please send /start again.");
        } else {
            await ctx.reply("Event created ✅ Check the message above to start the questionnaire.");
        }
    } catch (e) {
        console.error("QUESTIONARIO error:", e);
        await ctx.reply("Technical error: cannot start the questionnaire.");
    }
});

// =====================
// Inline buttons handling
// =====================
bot.on("callback_query", async (ctx) => {
    try {
        await upsertTelegramUserFromCtx(ctx);

        const data = ctx.callbackQuery?.data || "";
        const telegramUserId = Number(ctx.from?.id);
        if (!telegramUserId) return;

        if (data.startsWith("start_q:")) {
            const eventId = data.split(":")[1];

            await pool.query(
                `update questionnaire_sessions
         set status='in_progress', step=0, updated_at=now()
         where telegram_user_id=$1 and event_id=$2`,
                [telegramUserId, eventId]
            );

            await ctx.answerCbQuery("Starting…");
            await ctx.reply("Ok, let's start.");
            await ctx.reply(QUESTIONS[0].text);
            return;
        }

        if (data.startsWith("dismiss_q:")) {
            const eventId = data.split(":")[1];

            await pool.query(
                `update questionnaire_sessions
         set status='pending', updated_at=now()
         where telegram_user_id=$1 and event_id=$2`,
                [telegramUserId, eventId]
            );

            await ctx.answerCbQuery("Ok.");
            await ctx.reply("No problem. You can start later from the website or when you receive a new event.");
            return;
        }
    } catch (e) {
        console.error("callback_query error:", e);
        try {
            await ctx.answerCbQuery("Error");
        } catch { }
    }
});

// =====================
// Questionnaire answers (text messages)
// =====================
bot.on("text", async (ctx) => {
    try {
        await upsertTelegramUserFromCtx(ctx);

        const telegramUserId = Number(ctx.from?.id);
        const text = ctx.message?.text || "";
        if (!telegramUserId) return;

        if (text.startsWith("/")) return;

        // latest in_progress session
        const s = await pool.query(
            `select id, event_id, step
       from questionnaire_sessions
       where telegram_user_id=$1 and status='in_progress'
       order by updated_at desc
       limit 1`,
            [telegramUserId]
        );

        if (s.rowCount === 0) {
            await ctx.reply("No active questionnaire. If you had an event, tap the Start button in the message I sent you.");
            return;
        }

        const session = s.rows[0];
        const step = Number(session.step);
        const q = QUESTIONS[step];

        if (!q) {
            await pool.query(
                `update questionnaire_sessions set status='done', updated_at=now() where id=$1`,
                [session.id]
            );
            await ctx.reply("Questionnaire completed ✅");
            return;
        }

        // save answer
        await pool.query(
            `insert into responses (event_id, telegram_user_id, question_id, answer, meta)
       values ($1, $2, $3, $4, $5)`,
            [session.event_id, telegramUserId, q.id, text, null]
        );

        const nextStep = step + 1;

        if (nextStep >= QUESTIONS.length) {
            await pool.query(
                `update questionnaire_sessions
         set status='done', step=$2, updated_at=now()
         where id=$1`,
                [session.id, nextStep]
            );
            await ctx.reply("Thank you. Questionnaire completed ✅");
            return;
        }

        await pool.query(
            `update questionnaire_sessions
       set step=$2, updated_at=now()
       where id=$1`,
            [session.id, nextStep]
        );

        await ctx.reply(QUESTIONS[nextStep].text);
    } catch (e) {
        console.error("bot.on(text) error:", e);
        await ctx.reply("Technical error while saving your answer. Please try again.");
    }
});

// =====================
// API: Login code -> JWT token
// =====================
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

        if (r.rowCount === 0) return res.status(401).json({ ok: false, error: "Invalid code" });

        const row = r.rows[0];
        if (row.used_at) return res.status(401).json({ ok: false, error: "Code already used" });
        if (new Date(row.expires_at) < new Date()) return res.status(401).json({ ok: false, error: "Code expired" });

        await pool.query(`update login_codes set used_at = now() where id=$1`, [row.id]);

        const token = jwt.sign({ telegram_user_id: row.telegram_user_id }, JWT_SECRET, { expiresIn: "7d" });

        return res.json({ ok: true, token, uid: String(row.telegram_user_id) });
    } catch (e) {
        console.error("AUTH CODE error:", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});

// =====================
// API: list my events (web)
// =====================
app.get("/api/my/events", requireAuth, async (req, res) => {
    try {
        const telegramUserId = req.user.telegram_user_id;

        const r = await pool.query(
            `select id, created_at, event_type, device_id, payload
       from events
       where telegram_user_id=$1
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

app.get("/api/my/events/:id", requireAuth, async (req, res) => {
    try {
        const telegramUserId = req.user.telegram_user_id;
        const eventId = req.params.id;

        const ev = await pool.query(
            `select id, created_at, event_type, device_id, payload
       from events
       where id=$1 and telegram_user_id=$2`,
            [eventId, telegramUserId]
        );

        if (ev.rows.length === 0) {
            return res.status(404).json({ ok: false, error: "Event not found (or not yours)" });
        }

        const resp = await pool.query(
            `select id, created_at, question_id, answer, meta
       from responses
       where event_id=$1 and telegram_user_id=$2
       order by created_at asc`,
            [eventId, telegramUserId]
        );

        return res.json({ ok: true, event: ev.rows[0], responses: resp.rows });
    } catch (e) {
        console.error("EVENT DETAIL error:", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});

// =====================
// API: Panic (Arduino -> server)
// Creates event + notifies user with button
// =====================
app.post("/panic", async (req, res) => {
    const { telegram_user_id, hr, vibration } = req.body;

    if (!telegram_user_id) {
        return res.status(400).json({ ok: false, error: "Missing telegram_user_id" });
    }

    const telegramUserId = Number(telegram_user_id);

    try {
        // create event
        const result = await pool.query(
            `insert into events (device_id, event_type, payload, telegram_user_id)
       values ($1, $2, $3, $4)
       returning id`,
            ["calmband", "panic_detected", { hr, vibration, source: "arduino" }, telegramUserId]
        );

        const eventId = result.rows[0].id;

        // notify with inline buttons
        const n = await notifyQuestionnaireReady(telegramUserId, eventId);

        // always return ok (even if telegram can't message)
        if (!n.ok) {
            return res.json({ ok: true, event_id: eventId, warning: n.warning });
        }

        return res.json({ ok: true, event_id: eventId });
    } catch (e) {
        console.error("PANIC error:", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});

// =====================
// Webhook endpoint (Telegram calls this)
// =====================
app.post(`/${WEBHOOK_SECRET_PATH}`, async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
    } catch (e) {
        console.error("Webhook error:", e);
        res.sendStatus(500);
    }
});

// health
app.get("/", (req, res) => res.send("OK"));
app.get("/db-test", async (req, res) => {
    try {
        const r = await pool.query("select now() as now");
        res.json({ ok: true, now: r.rows[0].now });
    } catch (e) {
        res.status(500).json({ ok: false, error: e?.message, code: e?.code });
    }
});

// =====================
// Listen + setWebhook
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    const webhookUrl = `${PUBLIC_URL}/${WEBHOOK_SECRET_PATH}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log("Server listening on port", PORT);
    console.log("Webhook set to:", webhookUrl);
});

