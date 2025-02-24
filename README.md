```
# Zombie Adventure Bot

🎮 **Zombie Adventure Bot** is a fun, interactive Discord bot where users can embark on thrilling zombie battles, manage their inventory, and discover new items while improving their adventure experience.

---

## 📋 Features

- **Zombie Battles**: Challenge different types of zombies and engage in exciting combat!  
- **Inventory Management**: View and manage your items in your inventory.  
- **Commands**: Use simple commands to interact with the bot, including `!help` to see available commands, `!zombie` to start a battle, and more.  
- **Multi-Language Support**: Choose between English and Thai to interact with the bot.

---

## 🛠️ Installation

To install and run the bot, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/ZenonX12/MooBot.git
   ```
2. Navigate to the project directory:
   ```bash
   cd MooBot
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file and add your Discord bot token and webhook URL:
   ```plaintext
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_WEBHOOK_URL=your_discord_webhook_url
   ```
5. Run the bot:
   ```bash
   node index.js
   ```

---

## ✨ Commands

- **!zombie**: Start a new adventure and engage in a zombie battle.
- **!inventory**: Check your inventory and see the items you've collected.
- **!help**: View all available commands in both Thai and English.
- **Language Switch**: Choose between Thai and English using buttons.

---

## 💡 Features Breakdown

### 1. **Error Logging**:
   - Improved error handling for smooth operations.
   - Webhook logging to track errors and actions performed by users.

### 2. **Cooldowns**:
   - Prevents users from spamming commands like `!help` with a cooldown timer.

### 3. **Multi-Language Support**:
   - Users can choose to view commands in either Thai or English with a simple button click.

### 4. **Webhook Integration**:
   - Sends logs to a Discord webhook for better monitoring and debugging.

---

## 🤖 How it Works

### Zombie Battle:
- Choose a zombie type and engage in a combat scenario.
- Both the user and the zombie take turns attacking each other.
- If the user wins, they receive a reward item!

### Inventory System:
- Track all the items you collect throughout your journey.
- View and manage up to 100 items in your inventory.

---

## 🚀 Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Special Thanks

- [Discord.js](https://discord.js.org/) for the powerful library.
- [Axios](https://axios-http.com/) for easy HTTP requests.
- [Chalk](https://github.com/chalk/chalk) for beautiful terminal output.

---

Enjoy your adventure in the zombie world! 🧟‍♂️🛡️  
```
