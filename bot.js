require('dotenv').config(); // โหลดตัวแปรจากไฟล์ .env
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');

// ตรวจสอบว่า DISCORD_TOKEN และ DISCORD_WEBHOOK_URL มีค่าหรือไม่
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_WEBHOOK_URL) {
  console.error("Discord token or webhook URL is missing.");
  process.exit(1);
}

// สร้าง Client และกำหนด Intent ที่จำเป็น
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ฟังก์ชันส่งข้อความไปยัง Discord Webhook
const sendToDiscord = async (message) => {
  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, { content: message }, { timeout: 5000 });
  } catch (error) {
    console.error('Failed to send message to Discord:', error);
  }
};

// แจ้งสถานะบอทและจัดการข้อผิดพลาด
const handleBotStatus = async (message, error = null) => {
  console.log(message);  // แสดงข้อความใน console
  await sendToDiscord(message);  // ส่งข้อความไปยัง Discord Webhook
  if (error) console.error('Error:', error); // ถ้ามีข้อผิดพลาดให้แสดง
};

// เมื่อบอทออนไลน์แล้ว
client.once('ready', () => handleBotStatus('Bot is online!'));

// จัดการข้อผิดพลาดที่เกิดขึ้นจากบอท
client.on('error', (error) => handleBotStatus(`Error occurred: ${error.message || error}`, error));

// จัดการการล็อกอินที่ล้มเหลว
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  handleBotStatus(`Login failed: ${error.message || error}`, error);
  handleBotStatus('Bot is offline!');
  process.exit(1);
});

// การจัดการข้อผิดพลาดในการรับข้อความ
client.on('messageCreate', (message) => {
  if (message.author.bot) return;  // ป้องกันไม่ให้บอทตอบกลับตัวเอง
  // เพิ่มฟังก์ชันที่ต้องการที่นี่
});

// จับข้อผิดพลาดที่ไม่ได้รับการจัดการ
process.on('uncaughtException', (error) => {
  handleBotStatus(`Uncaught exception: ${error.message || error}`, error);
  process.exit(1);
});

// จับเหตุการณ์การปิดโปรแกรม (เช่น ctrl+c หรือ exit)
process.on('SIGINT', async () => {
  console.log('Bot is shutting down...');
  await handleBotStatus('Bot is offline!');
  process.exit(0); // ปิดโปรแกรมอย่างสงบ
});
