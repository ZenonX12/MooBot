require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
// ใช้ require เพื่อดึงไฟล์ต่าง ๆ
const items = require('./items');  // กลับขึ้นไปที่โฟลเดอร์หลัก
const { showShop, handlePurchase } = require('./Commands/shopCommands.js'); // ใช้เส้นทางสัมพัทธ์
const config = require('./config');


// สร้างบอท
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// เก็บข้อมูลเงินของผู้ใช้
const userBalance = {};

client.once('ready', () => {
    console.log('บอทออนไลน์แล้ว!');
});

// คำสั่งดูรายการสินค้าที่สามารถซื้อได้
client.on('messageCreate', (message) => {
    if (message.content === '!shop') {
        showShop(message);  // เรียกใช้ฟังก์ชัน showShop จาก shopCommands.js
    }
});

// คำสั่งซื้อสินค้าเมื่อผู้ใช้เลือกจากเมนู
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    await handlePurchase(interaction, userBalance);  // เรียกใช้ฟังก์ชัน handlePurchase
});

client.login(config.BOT_TOKEN);
