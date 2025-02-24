require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const chalk = require('chalk');

// นำเข้าคำสั่ง
const ZombieCommand = require('./commands/ZombieCommand');
const InventoryCommand = require('./commands/inventoryCommand');
const HelpCommand = require('./commands/helpCommand'); // นำเข้าคำสั่ง !help

// ฟังก์ชันส่งข้อมูลไปยัง Webhook
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

// การตั้งค่าบอท Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// การเริ่มต้นบอท
client.once('ready', async () => {
  console.log(chalk.green('✅ บอทออนไลน์และพร้อมใช้งาน!'));
  await sendToDiscordWebhook('✅ Bot Online', '```บอทกำลังทำงานและพร้อมใช้งาน!```', '#00FF00');
});

// การจัดการข้อความที่เข้ามา
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.trim()) return; // ข้ามข้อความที่ว่างหรือมาจากบอท

  const args = message.content.trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  try {
    switch (commandName) {
      case '!zombie':
        await ZombieCommand.execute(message);
        break;

      case '!inventory':
        await InventoryCommand.showInventory(message);
        break;

      case '!help': // เพิ่มคำสั่ง !help ที่นี่
        await HelpCommand.execute(message); // เรียกใช้คำสั่ง !help
        break;

      default:
        console.log(`คำสั่งที่ไม่รู้จัก: ${commandName}`);
        break;
    }
  } catch (error) {
    console.error(chalk.red(`❌ เกิดข้อผิดพลาดในการใช้คำสั่ง ${commandName}: ${error.message}`));
    message.reply(`เกิดข้อผิดพลาดในการใช้คำสั่ง ${commandName}`);
    await sendToDiscordWebhook(`❌ เกิดข้อผิดพลาดในการใช้คำสั่ง ${commandName}`, error.message);
  }
});

// การจัดการการตัดการเชื่อมต่อของบอท
client.on('shardDisconnect', async (event, id) => {
  console.warn(chalk.yellow(`⚠️ บอทตัดการเชื่อมต่อ (Shard ID: ${id})`));
  await sendToDiscordWebhook('⚠️ Bot Offline', `บอทตัดการเชื่อมต่อ (Shard ID: ${id})`, '#FFA500');
});

// การจัดการการปิดบอท
const shutdownHandler = async (reason) => {
  console.warn(chalk.yellow(`⚠️ กำลังปิดบอท: ${reason}`));
  
  const promises = [
    sendToDiscordWebhook('⚠️ Bot Offline', `กำลังปิดบอท: ${reason}`, '#FFA500')
  ];
  
  await Promise.all(promises);
  process.exit(0); // ปิดโปรเซสหลังจากดำเนินการทั้งหมดเสร็จ
};

// ฟังเหตุการณ์การปิดบอท
['beforeExit', 'SIGINT', 'SIGTERM'].forEach(event =>
  process.on(event, () => shutdownHandler(`ได้รับสัญญาณ ${event}`))
);

// การเข้าสู่ระบบของบอท
client.login(process.env.DISCORD_TOKEN)
  .catch(async (error) => {
    console.error(chalk.red(`❌ ข้อผิดพลาดในการเข้าสู่ระบบ: ${error.message}`));
    await sendToDiscordWebhook('❌ ข้อผิดพลาดในการเข้าสู่ระบบ', error.message);
    process.exit(1); // ออกจากโปรเซสหากเข้าสู่ระบบไม่ได้
  });
