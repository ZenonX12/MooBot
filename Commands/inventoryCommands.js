const fs = require('fs');

const inventoryFile = './inventory.json';

// 🔹 ตั้งค่า ID ของแอดมินที่อนุญาตให้ใช้ !additem
const ADMIN_IDS = ['1162698123181817857', '1336336016721711149']; // 🔹 เปลี่ยนเป็น ID ของคุณ

// โหลดข้อมูลคลังจากไฟล์
let userInventory = {};

function loadInventory() {
    if (fs.existsSync(inventoryFile)) {
        try {
            const data = fs.readFileSync(inventoryFile);
            userInventory = JSON.parse(data);
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }
}

// บันทึกข้อมูลคลังลงไฟล์
function saveInventory() {
    try {
        fs.writeFileSync(inventoryFile, JSON.stringify(userInventory, null, 2));
    } catch (error) {
        console.error('Error saving inventory:', error);
    }
}

// แสดงคลังไอเท็ม
function showInventory(message) {
    const userId = message.author.id;
    if (!userInventory[userId] || userInventory[userId].length === 0) {
        return message.reply('📦 คุณไม่มีไอเท็มในคลัง!');
    }

    const itemList = userInventory[userId].map((item, index) => `**${index + 1}.** ${item}`).join('\n');
    message.reply(`🎒 **คลังไอเท็มของคุณ:**\n${itemList}`);
}

// ✅ เพิ่มไอเท็มได้เฉพาะคนที่อยู่ใน ADMIN_IDS เท่านั้น
function addItem(message, itemName) {
    const userId = message.author.id;

    if (!ADMIN_IDS.includes(userId)) {
        return message.reply('❌ คุณไม่มีสิทธิ์เพิ่มไอเท็ม! เฉพาะแอดมินที่กำหนดไว้เท่านั้นที่สามารถใช้คำสั่งนี้');
    }

    if (!itemName) {
        return message.reply('❌ โปรดระบุชื่อไอเท็มที่ต้องการเพิ่ม! ใช้: `!additem <ชื่อไอเท็ม>`');
    }

    if (!userInventory[userId]) {
        userInventory[userId] = [];
    }

    userInventory[userId].push(itemName);
    saveInventory();
    message.reply(`✅ คุณได้เพิ่ม **${itemName}** ลงในคลังของคุณ!`);
}

// ลบไอเท็มออกจากคลัง
function removeItem(message, itemName) {
    const userId = message.author.id;
    if (!userInventory[userId] || userInventory[userId].length === 0) {
        return message.reply('📦 คลังของคุณว่างเปล่า ไม่มีไอเท็มให้ลบ!');
    }

    const itemIndex = userInventory[userId].indexOf(itemName);
    if (itemIndex === -1) {
        return message.reply(`❌ ไม่พบไอเท็ม **${itemName}** ในคลังของคุณ!`);
    }

    userInventory[userId].splice(itemIndex, 1);
    saveInventory();
    message.reply(`🗑️ ไอเท็ม **${itemName}** ถูกลบออกจากคลังของคุณแล้ว!`);
}

// โหลดคลังเมื่อบอทเริ่มทำงาน
loadInventory();

// ส่งออกฟังก์ชันให้ใช้ใน main bot file
module.exports = { showInventory, addItem, removeItem };
