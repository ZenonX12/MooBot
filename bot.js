require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const ZombieCommand = require('./commands/ZombieCommand');
const axios = require('axios');
const chalk = require('chalk');

// ฟังก์ชันส่งข้อความไปยัง Discord Webhook
const sendToDiscordWebhook = async (title, message, color = '#FF0000') => {
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setTimestamp();

    await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(chalk.red(`❌ Webhook Error: ${error.message}`));
  }
};

// ตั้งค่าบอท
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// เมื่อบอทออนไลน์
client.once('ready', async () => {
  console.log(chalk.green('✅ Bot is online and ready to go!'));
  await sendToDiscordWebhook('✅ Bot Online', '```The bot is running and ready!```', '#00FF00');
});

// จัดการข้อความที่ได้รับ
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  if (commandName === '!zombie') {
    try {
      await ZombieCommand.execute(message);
    } catch (error) {
      console.error(chalk.red(`❌ Error executing !zombie: ${error.message}`));
      message.reply('An error occurred while executing the command.');
      await sendToDiscordWebhook('❌ Error executing !zombie', error.message);
    }
  }
});

// แจ้งเตือนเมื่อบอทถูกตัดการเชื่อมต่อ
client.on('shardDisconnect', async (event, id) => {
  console.warn(chalk.yellow(`⚠️ Disconnected (Shard ID: ${id})`));
  await sendToDiscordWebhook('⚠️ Bot Offline', `The bot disconnected (Shard ID: ${id})`, '#FFA500');
});

// จัดการการปิดตัวของบอท
const shutdownHandler = async (reason) => {
  console.warn(chalk.yellow(`⚠️ Shutting down: ${reason}`));
  
  await Promise.allSettled([
    sendToDiscordWebhook('⚠️ Bot Offline', `Shutting down: ${reason}`, '#FFA500')
  ]);

  process.exit(0);
};

// ดักจับเหตุการณ์ที่ทำให้บอทปิดตัว
['beforeExit', 'SIGINT', 'SIGTERM'].forEach(event => 
  process.on(event, () => shutdownHandler(`Received ${event}`))
);

// ล็อกอินบอท
client.login(process.env.DISCORD_TOKEN).catch(async (error) => {
  console.error(chalk.red(`❌ Login Error: ${error.message}`));
  await sendToDiscordWebhook('❌ Error logging in', error.message);
  process.exit(1);
});
