require('dotenv').config(); // โหลดตัวแปรจากไฟล์ .env
const axios = require('axios');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');  // ใช้ chalk สำหรับสี

// ฟังก์ชันเช็คค่า DISCORD_TOKEN และ DISCORD_WEBHOOK_URL
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

// ฟังก์ชันที่ส่งข้อความไปยัง Discord Webhook
const sendToDiscord = async (message) => {
  try {
    const embed = new EmbedBuilder()
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

// ฟังก์ชันจัดการสถานะบอท
const handleBotStatus = async (message, error = null) => {
  console.log(message);
  await sendToDiscord(`\`\`\`${message}\`\`\``);
  if (error) console.error(chalk.red('Error:', error));
};

// สร้าง Client และกำหนด Intent ที่จำเป็น
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// เมื่อบอทออนไลน์แล้ว
client.once('ready', () => {
  handleBotStatus('🚀 Bot is online! 🌟');
  console.log(chalk.magenta('Credits: by Xeno & Moobot'));
});

// การล็อกอินของบอท
const loginBot = async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    handleBotStatus(chalk.red(`❌ Login failed: ${error.message || error}`), error);
    process.exit(1);
  }
};

// การจัดการข้อผิดพลาดที่เกิดขึ้นจากบอท
client.on('error', (error) => handleBotStatus(chalk.yellow(`⚠️ Error occurred: ${error.message || error}`), error));

// จับข้อผิดพลาดที่ไม่ได้รับการจัดการ
process.on('uncaughtException', async (error) => {
  await handleBotStatus(chalk.red(`⚠️ Uncaught exception: ${error.message || error}`), error);
  process.exit(1);
});

// การปิดโปรแกรมของบอท
process.on('SIGINT', async () => {
  console.log('Bot is shutting down...');
  await handleBotStatus('🚫 Bot is offline!');
  process.exit(0);
});

// เรียกใช้ฟังก์ชันที่จำเป็น
checkEnvVars();
loginBot();
