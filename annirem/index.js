require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const adminChatId = Number(process.env.ADMIN_CHAT_ID);

console.log(`[INIT] Bot started. Admin chat ID: ${adminChatId}`);

// ---------------- STATE ----------------
// userState[chatId] = { category, step, title }
// step: "awaiting_title" | "awaiting_body"
const userState = {};

// messageId → userChatId mapping
const messageMap = {};

// ---------------- TAGS ----------------
const tagMap = {
    prayer:     "#prayer #spiritual #help",
    counselling:"#counselling #mentalhealth #support",
    academic:   "#academic #studyhelp #education",
    contact:    "#coordinator #urgent #support"
};

// ---------------- HELPER ----------------
function logState(chatId, label) {
    console.log(`[STATE | ${label}] chatId=${chatId}`, JSON.stringify(userState[chatId] || null));
}

// ---------------- COMMANDS ----------------
bot.onText(/\/prayer/, (msg) => {
    userState[msg.chat.id] = { category: "prayer", step: "awaiting_title" };
    logState(msg.chat.id, "/prayer triggered");
    bot.sendMessage(msg.chat.id, "🙏 Enter your prayer *title*:", { parse_mode: "Markdown" });
});

bot.onText(/\/counselling/, (msg) => {
    userState[msg.chat.id] = { category: "counselling", step: "awaiting_title" };
    logState(msg.chat.id, "/counselling triggered");
    bot.sendMessage(msg.chat.id, "💬 Enter your counselling *title*:", { parse_mode: "Markdown" });
});

bot.onText(/\/academic/, (msg) => {
    userState[msg.chat.id] = { category: "academic", step: "awaiting_title" };
    logState(msg.chat.id, "/academic triggered");
    bot.sendMessage(msg.chat.id, "📚 Enter your academic help *title*:", { parse_mode: "Markdown" });
});

bot.onText(/\/contact/, (msg) => {
    userState[msg.chat.id] = { category: "contact", step: "awaiting_title" };
    logState(msg.chat.id, "/contact triggered");
    bot.sendMessage(msg.chat.id, "📞 Enter your coordinator request *title*:", { parse_mode: "Markdown" });
});

// ---------------- USER MESSAGE ----------------
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`[MESSAGE] chatId=${chatId} | text="${text}"`);

    if (!text) {
        console.log(`[SKIP] No text content in message from chatId=${chatId}`);
        return;
    }

    // ---------------- ADMIN REPLY HANDLING ----------------
    if (chatId === adminChatId && msg.reply_to_message) {
        const originalMessageId = msg.reply_to_message.message_id;
        const targetUserId = messageMap[originalMessageId];

        console.log(`[ADMIN REPLY] Replying to messageId=${originalMessageId} → targetUserId=${targetUserId}`);

        if (targetUserId) {
            bot.sendMessage(targetUserId, `📩 Reply from coordinator:\n\n${text}`);
            console.log(`[ADMIN REPLY] Sent reply to userId=${targetUserId}`);
        } else {
            console.log(`[ADMIN REPLY] No user found for messageId=${originalMessageId} — might be an old message`);
        }

        return;
    }

    // Ignore other messages from admin that aren't replies
    if (chatId === adminChatId) {
        console.log(`[SKIP] Message from admin chatId without a reply context — ignoring`);
        return;
    }

    // Ignore slash commands (handled by onText above)
    if (text.startsWith("/")) {
        console.log(`[SKIP] Slash command from chatId=${chatId} — handled by onText`);
        return;
    }

    const state = userState[chatId];

    if (!state) {
        console.log(`[NO STATE] chatId=${chatId} has no active state — sending usage hint`);
        return bot.sendMessage(chatId, "Please use /prayer, /counselling, /academic or /contact first.");
    }

    logState(chatId, "before step check");

    // ---------------- STEP 1: Collect Title ----------------
    if (state.step === "awaiting_title") {
        console.log(`[STEP 1] chatId=${chatId} provided title: "${text}"`);
        userState[chatId] = { ...state, title: text, step: "awaiting_body" };
        logState(chatId, "after storing title");
        return bot.sendMessage(chatId, "✏️ Now enter your *message* or description:", { parse_mode: "Markdown" });
    }

    // ---------------- STEP 2: Collect Body & Forward ----------------
    if (state.step === "awaiting_body") {
        const { category, title } = state;
        const tags = tagMap[category];
        const body = text;

        console.log(`[STEP 2] chatId=${chatId} | category="${category}" | title="${title}" | body="${body}"`);

        if (!tags) {
            console.log(`[ERROR] No tags found for category="${category}" — this should never happen`);
        }

        const formatted =
`📌 Category: ${category}

📝 Title: ${title}

💬 Message: ${body}

${tags}`;

        console.log(`[FORWARD] Sending to adminChatId=${adminChatId}:\n${formatted}`);

        bot.sendMessage(adminChatId, formatted).then((sentMsg) => {
            messageMap[sentMsg.message_id] = chatId;
            console.log(`[FORWARD SUCCESS] Stored messageMap[${sentMsg.message_id}] = ${chatId}`);
        }).catch((err) => {
            console.error(`[FORWARD ERROR] Failed to send to admin:`, err.message);
        });

        delete userState[chatId];
        console.log(`[STATE CLEARED] chatId=${chatId} state deleted after successful submission`);

        return bot.sendMessage(chatId, "✅ Sent successfully! A coordinator will get back to you.");
    }

    // Fallback — shouldn't normally reach here
    console.log(`[FALLBACK] chatId=${chatId} reached fallback — unknown step: "${state.step}"`);
    bot.sendMessage(chatId, "Something went wrong. Please start again with /prayer, /counselling, /academic or /contact.");
    delete userState[chatId];
});