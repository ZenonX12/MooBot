require('dotenv').config(); // โหลด environment variables จาก .env
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');  // เพิ่ม EmbedBuilder ที่นี่
const fightCommand = require('./commands/Zombie');  // นำเข้าไฟล์คำสั่ง Zombie 
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Function to check the values of DISCORD_TOKEN and DISCORD_WEBHOOK_URL
const checkEnvVars = () => {
  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_WEBHOOK_URL) {
    console.error(chalk.red("Missing Discord token or webhook URL"));
    process.exit(1);
  }

  const webhookRegex = /^https:\/\/discord.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;
  if (!webhookRegex.test(process.env.DISCORD_WEBHOOK_URL)) {
    console.error(chalk.red("Invalid Discord webhook URL format"));
    process.exit(1);
  }
};

// Function to send messages to Discord Webhook
const sendToDiscord = async (message) => {
  try {
    const embed = new EmbedBuilder()  // ใช้ EmbedBuilder ที่นี่
      .setTitle('Bot Status')
      .setDescription(message)
      .setColor('#00FF00')
      .setTimestamp();

    const response = await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status !== 204) {
      console.error(chalk.red(`Failed to send to Discord: Status code ${response.status}`));
    }
  } catch (error) {
    console.error(chalk.red('Error sending message to Discord:', error.message));
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

// Function to handle bot status
const handleBotStatus = async (message, error = null) => {
  console.log(message);
  await sendToDiscord(`\`\`\`${message}\`\`\``);
  if (error) console.error(chalk.red('Error:', error));
};

// Create Client and set necessary intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// When the bot is online
client.once('ready', () => {
  handleBotStatus('🚀 Bot is online! 🌟');
  console.log(chalk.magenta('Credits: by Xeno & Moobot'));
});

// Log in the bot
const loginBot = async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    handleBotStatus(chalk.red(`❌ Login failed: ${error.message || error}`), error);
    process.exit(1);
  }
};

// Handling messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;  // ป้องกันไม่ให้บอทตอบข้อความตัวเอง

  const args = message.content.trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  // Check if the command exists in the commands map
  if (commandName === '!Zombie') {
    try {
      await fightCommand.execute(message);
    } catch (error) {
      console.error(chalk.red('Error executing command:', error.message));
      message.reply('An error occurred while executing the command');
    }
  }
});

// Handling errors from the bot
client.on('error', (error) => handleBotStatus(chalk.yellow(`⚠️ Error occurred: ${error.message || error}`), error));

// Handling uncaught exceptions
process.on('uncaughtException', async (error) => {
  await handleBotStatus(chalk.red(`⚠️ Uncaught exception: ${error.message || error}`), error);
  process.exit(1);
});

// Handling bot shutdown
process.on('SIGINT', async () => {
  console.log('Bot is shutting down...');
  await handleBotStatus('🚫 Bot is offline!');
  process.exit(0);
});

// Call necessary functions
checkEnvVars();
loginBot();
