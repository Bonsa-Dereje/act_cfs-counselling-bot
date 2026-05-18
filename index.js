require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Read from .env and ensure it's a number
const adminChatId = Number(process.env.ADMIN_CHAT_ID);

// Optional start message
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "Send your message and it will be forwarded anonymously."
    );
});

// Main message handler
bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    // Ignore commands
    if (msg.text && msg.text.startsWith("/")) return;

    // Ignore empty messages
    if (!msg.text) return;

    // Prevent admin group loop
    if (chatId === adminChatId) return;

    const anonymousMessage =
        `📩 Anonymous Message:\n\n${msg.text}`;

    bot.sendMessage(adminChatId, anonymousMessage);
});