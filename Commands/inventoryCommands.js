const fs = require('fs').promises;
const { EmbedBuilder } = require('discord.js');

const inventoryFile = './inventory.json';
const ADMIN_IDS = ['1162698123181817857', '1336336016721711149'];

let userInventory = {};

async function loadInventory() {
    try {
        const data = await fs.readFile(inventoryFile, 'utf8');
        userInventory = JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading inventory:', error);
    }
}

async function saveInventory() {
    try {
        await fs.writeFile(inventoryFile, JSON.stringify(userInventory, null, 2));
    } catch (error) {
        console.error('❌ Error saving inventory:', error);
    }
}

function showInventory(message) {
    const userId = message.author.id;
    if (!userInventory[userId]) {
        userInventory[userId] = [];
    }

    const items = userInventory[userId];
    const embed = new EmbedBuilder()
        .setColor(items.length > 0 ? '#0099ff' : '#ff5555')
        .setTitle('🎒 คลังไอเท็มของคุณ')
        .setDescription(items.length > 0 
            ? items.map((item, index) => `**${index + 1}.** ${item}`).join('\n') 
            : '📭 **คลังของคุณว่างเปล่า!**')
        .setFooter({ text: `🔹 ขอให้โชคดีในการสะสมไอเท็ม!`, iconURL: message.author.displayAvatarURL() });

    message.reply({ embeds: [embed] });
}

const ITEM_LIMIT = 5;

function addItem(message, itemName) {
    const userId = message.author.id;
    if (!ADMIN_IDS.includes(userId)) {
        return message.reply('🚫 **คุณไม่มีสิทธิ์เพิ่มไอเท็ม!**');
    }

    if (!itemName || itemName.trim() === '') {
        return message.reply('❌ **โปรดระบุชื่อไอเท็มที่ต้องการเพิ่ม!**\n📌 ตัวอย่าง: `!additem <ชื่อไอเท็ม>`');
    }

    if (!userInventory[userId]) userInventory[userId] = [];
    if (userInventory[userId].length >= ITEM_LIMIT) {
        return message.reply(`❌ **คุณไม่สามารถถือไอเท็มได้เกิน ${ITEM_LIMIT} รายการ!**`);
    }

    userInventory[userId].push(itemName.trim());
    saveInventory();

    const embed = new EmbedBuilder()
        .setColor('#00cc66')
        .setTitle('✅ ไอเท็มถูกเพิ่มสำเร็จ!')
        .setDescription(`📦 **เพิ่มไอเท็ม:** \`${itemName}\` **ลงในคลังของคุณแล้ว!**`)
        .setFooter({ text: '🛠️ แอดมินสามารถเพิ่มไอเท็มได้', iconURL: message.author.displayAvatarURL() });

    message.reply({ embeds: [embed] });
}

function removeItem(message, itemName) {
    const userId = message.author.id;
    const items = userInventory[userId] || [];

    if (items.length === 0) {
        return message.reply('📭 **คลังของคุณว่างเปล่า! ไม่มีไอเท็มให้ลบ**');
    }

    const itemIndex = items.indexOf(itemName);
    if (itemIndex === -1) {
        return message.reply(`❌ **ไม่พบไอเท็ม:** \`${itemName}\` **ในคลังของคุณ!**`);
    }

    items.splice(itemIndex, 1);
    saveInventory();

    const embed = new EmbedBuilder()
        .setColor('#ff4444')
        .setTitle('🗑️ ไอเท็มถูกลบสำเร็จ!')
        .setDescription(`❌ **ไอเท็ม:** \`${itemName}\` **ถูกลบออกจากคลังของคุณแล้ว!**`)
        .setFooter({ text: '🔹 ตรวจสอบคลังของคุณโดยใช้ !inventory', iconURL: message.author.displayAvatarURL() });

    message.reply({ embeds: [embed] });
}

loadInventory();

module.exports = { showInventory, addItem, removeItem };
