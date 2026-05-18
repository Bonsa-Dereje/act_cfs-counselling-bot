# 🕊️ ACT CSF Bot

> A Telegram bot for student support — connecting people to prayer, counselling, academic help, and coordinators.

---

## What It Does

Students send a request through one of four categories. The message is forwarded to the admin group with a tag. Coordinators can reply directly from the group, and the student receives the response privately.

---

## Commands

| Command | Description |
|---|---|
| `/prayer` | Submit a prayer topic |
| `/counselling` | Request counselling support |
| `/academic` | Ask for academic help |
| `/contact` | Send a message to a coordinator |

---

## How It Works

```
Student sends /prayer
        ↓
Bot prompts: "Enter your prayer topic"
        ↓
Student types their message
        ↓
Admin group receives:
  📌 Category: prayer
  💬 Message: [student's message]
  #prayer
        ↓
Coordinator replies in the group thread
        ↓
Student receives the reply privately
```

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/act-csf-bot
cd act-csf-bot
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_admin_group_chat_id
```

- **BOT_TOKEN** — get this from [@BotFather](https://t.me/BotFather) on Telegram
- **ADMIN_CHAT_ID** — the chat ID of your admin/coordinator group (negative number for groups)

### 3. Run

```bash
node bot.js
```

You should see:
```
[INIT] Bot started. Admin chat ID: -100xxxxxxxxx
```

---

## Admin Reply Flow

To reply to a student from the admin group:

1. Find the forwarded message in the group
2. **Reply** to that specific message (use Telegram's reply feature)
3. Type your response
4. The student will receive it as a private message

> ⚠️ You must **reply** to the forwarded message — not just send a new message in the group.

---

## Project Structure

```
act-csf-bot/
├── bot.js        # Main bot logic
├── .env          # Environment variables (never commit this)
├── package.json
└── README.md
```

---

## Dependencies

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [dotenv](https://github.com/motdotla/dotenv)

---

## Notes

- Messages are stored in memory. Restarting the bot clears the reply map — old forwarded messages can no longer be replied to.
- The bot ignores all messages from the admin group unless they are replies to a forwarded student message.

---

*Built for ACT CSF Student Support*