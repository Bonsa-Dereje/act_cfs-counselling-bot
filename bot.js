require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const https = require("https");

const app = express();

// ---------------- KEEP ALIVE SERVER ----------------
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bot is alive");
});

app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
});

// ---------------- TELEGRAM BOT ----------------
const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true,
});

const adminChatId = Number(process.env.ADMIN_CHAT_ID);

console.log(`[INIT] Bot started. Admin chat ID: ${adminChatId}`);

// ---------------- STATE ----------------
// userState[chatId] = { category, step }
// step: "awaiting_body"
const userState = {};

// messageId → userChatId mapping
const messageMap = {};

// ---------------- TAGS ----------------
const tagMap = {
    prayer: "#prayer",
    counselling: "#counselling",
    academic: "#academic",
    contact: "#contact",
};

// ---------------- HELPER ----------------
function logState(chatId, label) {
    console.log(
        `[STATE | ${label}] chatId=${chatId}`,
        JSON.stringify(userState[chatId] || null)
    );
}

// ---------------- COMMANDS ----------------
bot.onText(/\/prayer/, (msg) => {
    userState[msg.chat.id] = {
        category: "prayer",
        step: "awaiting_body",
    };

    logState(msg.chat.id, "/prayer triggered");

    bot.sendMessage(
        msg.chat.id,
        "🙏 What should we pray for you about?"
    );
});

bot.onText(/\/counselling/, (msg) => {
    userState[msg.chat.id] = {
        category: "counselling",
        step: "awaiting_body",
    };

    logState(msg.chat.id, "/counselling triggered");

    bot.sendMessage(
        msg.chat.id,
        "💬 Tell us what's on your heart:"
    );
});

bot.onText(/\/academic/, (msg) => {
    userState[msg.chat.id] = {
        category: "academic",
        step: "awaiting_body",
    };

    logState(msg.chat.id, "/academic triggered");

    bot.sendMessage(
        msg.chat.id,
        "📚 Anything making you struggle with your classes?"
    );
});

bot.onText(/\/contact/, (msg) => {
    userState[msg.chat.id] = {
        category: "contact",
        step: "awaiting_body",
    };

    logState(msg.chat.id, "/contact triggered");

    bot.sendMessage(
        msg.chat.id,
        "📞 Please send us your Telegram username so we can contact you:"
    );
});

// ---------------- USER MESSAGE ----------------
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`[MESSAGE] chatId=${chatId} | text="${text}"`);

    if (!text) {
        console.log(
            `[SKIP] No text content in message from chatId=${chatId}`
        );
        return;
    }

    // ---------------- ADMIN REPLY HANDLING ----------------
    if (chatId === adminChatId && msg.reply_to_message) {
        const originalMessageId =
            msg.reply_to_message.message_id;

        const targetUserId =
            messageMap[originalMessageId];

        console.log(
            `[ADMIN REPLY] Replying to messageId=${originalMessageId} → targetUserId=${targetUserId}`
        );

        if (targetUserId) {
            bot.sendMessage(
                targetUserId,
                `📩 Reply from coordinator:\n\n${text}`
            );

            console.log(
                `[ADMIN REPLY] Sent reply to userId=${targetUserId}`
            );
        } else {
            console.log(
                `[ADMIN REPLY] No user found for messageId=${originalMessageId}`
            );
        }

        return;
    }

    // Ignore other admin messages
    if (chatId === adminChatId) {
        console.log(
            `[SKIP] Admin message without reply context`
        );
        return;
    }

    // Ignore slash commands
    if (text.startsWith("/")) {
        console.log(
            `[SKIP] Slash command handled separately`
        );
        return;
    }

    const state = userState[chatId];

    if (!state) {
        console.log(
            `[NO STATE] chatId=${chatId} has no active state`
        );

        return bot.sendMessage(
            chatId,
            "Please use /prayer, /counselling, /academic or /contact first."
        );
    }

    logState(chatId, "before step check");

    // ---------------- STEP: Collect Body & Forward ----------------
    if (state.step === "awaiting_body") {
        const { category } = state;

        const tags = tagMap[category];

        console.log(
            `[FORWARD] chatId=${chatId} | category="${category}" | body="${text}"`
        );

        const formatted =
`📌 Category: ${category}

💬 Message:
${text}

${tags}`;

        console.log(
            `[FORWARD] Sending to adminChatId=${adminChatId}`
        );

        bot.sendMessage(adminChatId, formatted)
            .then((sentMsg) => {
                messageMap[sentMsg.message_id] = chatId;

                console.log(
                    `[FORWARD SUCCESS] Stored messageMap[${sentMsg.message_id}] = ${chatId}`
                );
            })
            .catch((err) => {
                console.error(
                    `[FORWARD ERROR]`,
                    err.message
                );
            });

        delete userState[chatId];

        console.log(
            `[STATE CLEARED] chatId=${chatId}`
        );

        return bot.sendMessage(
            chatId,
            "✅ Sent successfully! A coordinator will get back to you."
        );
    }

    // ---------------- FALLBACK ----------------
    console.log(
        `[FALLBACK] Unknown state step`
    );

    bot.sendMessage(
        chatId,
        "Something went wrong. Please start again with /prayer, /counselling, /academic or /contact."
    );

    delete userState[chatId];
});

// ---------------- SELF PING ----------------
// Replace this with your actual Render URL
const RENDER_URL =
    process.env.RENDER_EXTERNAL_URL ||
    "https://your-app-name.onrender.com";

setInterval(() => {
    https
        .get(RENDER_URL, (res) => {
            console.log(
                `[SELF PING] Status Code: ${res.statusCode}`
            );
        })
        .on("error", (err) => {
            console.error(
                `[SELF PING ERROR]`,
                err.message
            );
        });
}, 10 * 60 * 1000); // every 10 minutes