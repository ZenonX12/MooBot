// นำเข้าโมดูลที่จำเป็นจาก discord.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ตัวแปรสำหรับเก็บข้อมูลอินเวนทอรีของผู้เล่น
let inventories = {};

// ฟังก์ชันสำหรับเพิ่มไอเทมลงในอินเวนทอรี
function addItemToInventory(userId, item) {
  if (!inventories[userId]) {
    inventories[userId] = []; // ถ้ายังไม่มีอินเวนทอรีสำหรับผู้ใช้ ให้สร้างอินเวนทอรีใหม่
  }
  inventories[userId].push(item); // เพิ่มไอเทมลงในอินเวนทอรี
  console.log(`Received ${item.name} from ${userId}`);
}

// ฟังก์ชันสำหรับดึงข้อมูลอินเวนทอรีของผู้ใช้
function getInventory(userId) {
  return inventories[userId] || []; // ถ้าไม่มีอินเวนทอรีให้คืนค่าเป็นอาร์เรย์ว่าง
}

// ฟังก์ชันสำหรับแสดงรายการไอเทมในอินเวนทอรี (ไม่มีปุ่มลบแล้ว)
async function showInventory(message) {
  const userId = message.author.id; // ใช้ user ID ของผู้ส่งข้อความ
  const userInventory = getInventory(userId);

  if (!userInventory || userInventory.length === 0) {
    return message.reply("You have no items in your inventory!"); // ถ้าไม่มีไอเทม
  }

  // สร้าง Embed ใหม่สำหรับแสดงอินเวนทอรี
  const inventoryEmbed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Inventory`) // หัวข้อที่แสดงชื่อผู้ใช้
    .setColor('#3b82f6') // เปลี่ยนสีของ Embed ให้ดูโดดเด่น
    .setThumbnail(message.author.avatarURL()) // ใช้รูปโปรไฟล์ของผู้ใช้
    .setDescription(`Here is the list of items in your inventory!`) // เพิ่มคำอธิบาย
    .setTimestamp() // เพิ่มเวลาในการส่งข้อความ
    .setFooter({
      text: 'Inventory System',
      iconURL: 'https://i.imgur.com/xyz1234.png', // คุณสามารถใช้ URL ของไอคอนที่ต้องการ
    });

  // ลูปผ่านไอเทมและเพิ่มฟิลด์ลงใน Embed
  userInventory.forEach((item, index) => {
    inventoryEmbed.addFields({
      name: `Item ${index + 1}: ${item.name}`,
      value: `${item.description}\n**Type:** ${item.type}\n**Rarity:** ${item.rarity}`, // เพิ่มรายละเอียดไอเทม
      inline: false,
    });
  });

  // ส่งข้อความ Embed ที่แสดงอินเวนทอรี
  await message.reply({ embeds: [inventoryEmbed] });
}

// ส่งออกฟังก์ชันที่สามารถใช้งานได้จากภายนอก
module.exports = {
  addItemToInventory,
  getInventory,
  showInventory,
};
