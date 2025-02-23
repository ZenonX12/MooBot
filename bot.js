require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fightCommand = require('./Commands/fightCommands');
const { showInventory, addItem, removeItem } = require('./Commands/inventoryCommands.js');
const config = require('./config');
const fs = require('fs');

const userBalancesFile = './userBalances.json';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// โหลดข้อมูลเงินผู้ใช้จากไฟล์
let userBalances = {};

function loadUserBalances() {
    if (fs.existsSync(userBalancesFile)) {
        try {
            const data = fs.readFileSync(userBalancesFile);
            userBalances = JSON.parse(data);
        } catch (error) {
            console.error('❌ Error loading user balances:', error);
        }
    } else {
        console.log('⚠️ No userBalances.json file found. Starting with an empty balance.');
    }
}

// บันทึกเงินผู้ใช้ลงไฟล์
async function saveUserBalances() {
    try {
        fs.writeFileSync(userBalancesFile, JSON.stringify(userBalances, null, 2)); // ใช้ writeFileSync แทน
    } catch (error) {
        console.error('❌ Error saving user balances:', error);
    }
}

// บอทพร้อมใช้งาน
client.once('ready', () => {
    console.log('✅ Bot is online!');
    loadUserBalances();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift()?.toLowerCase(); // ใช้ optional chaining เพื่อป้องกันการ error หาก args ว่าง

    if (!command) return; // หากไม่มีคำสั่งให้ไม่ทำอะไร

    const userId = message.author.id;

    // ✅ คำสั่งต่อสู้
    if (command === '!fight') {
        const userBalance = userBalances[userId] || 0;

        try {
            const updatedBalance = await fightCommand.execute(message, userBalance);
            if (updatedBalance !== userBalance) {
                userBalances[userId] = updatedBalance;
                await saveUserBalances();
            }
        } catch (error) {
            console.error('❌ Error during fight:', error);
            message.reply('⚠️ เกิดข้อผิดพลาดระหว่างการต่อสู้! ลองใหม่อีกครั้ง');
        }
        return;
    }

    // ✅ คำสั่งคลังไอเท็ม
    if (command === '!inventory') {
        showInventory(message);
        return;
    }

    if (command === '!additem') {
        const itemName = args.join(' ').trim();
        if (!itemName) {
            return message.reply('❌ กรุณาระบุชื่อไอเท็มที่จะเพิ่ม!');
        }
        addItem(message, itemName);
        return;
    }

    if (command === '!removeitem') {
        const itemName = args.join(' ').trim();
        if (!itemName) {
            return message.reply('❌ กรุณาระบุชื่อไอเท็มที่จะลบ!');
        }
        removeItem(message, itemName);
        return;
    }
});

// ✅ บันทึกเงินผู้ใช้ก่อนปิดบอท
process.on('SIGINT', async () => {
    await saveUserBalances();
    console.log('💾 User balances saved. Exiting...');
    process.exit();
});

// ✅ ล็อกอินบอท
client.login(config.BOT_TOKEN).catch(error => {
    console.error('❌ Failed to log in:', error);
});
