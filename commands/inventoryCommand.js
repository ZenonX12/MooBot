// ตัวแปรสำหรับเก็บข้อมูลอินเวนทอรีของผู้เล่น
let inventories = {};

// ฟังก์ชันเพิ่มไอเทมลงในอินเวนทอรี
function addItemToInventory(userId, item) {
  if (!inventories[userId]) {
    inventories[userId] = []; // ถ้ายังไม่มีอินเวนทอรีสำหรับผู้ใช้
  }
  inventories[userId].push(item); // เพิ่มไอเทมลงในอินเวนทอรี
  console.log(`เพิ่มไอเทม ${item.name} ให้กับผู้ใช้ ${userId}`);
}

// ฟังก์ชันดึงข้อมูลอินเวนทอรีของผู้ใช้
function getInventory(userId) {
  return inventories[userId] || []; // ถ้าไม่มีข้อมูลให้คืนค่าเป็นอาร์เรย์ว่าง
}

// ฟังก์ชันแสดงรายการไอเทมในอินเวนทอรี
function showInventory(message) {
  const userId = message.author.id; // ใช้ user ID ของผู้ส่งข้อความ
  const userInventory = getInventory(userId);
  
  if (!userInventory || userInventory.length === 0) {
    return message.reply("คุณไม่มีไอเทมในอินเวนทอรี!"); // ถ้าไม่มีไอเทม
  }
  
  // สร้างข้อความแสดงรายการไอเทม
  const itemsList = userInventory
    .map((item, index) => `${index + 1}. ${item.name} - ${item.description}`)
    .join('\n'); // สร้างข้อความที่ประกอบด้วยไอเทมแต่ละตัว

  // ส่งข้อความที่แสดงรายการไอเทม
  message.reply(`คุณมีไอเทมในอินเวนทอรี:\n${itemsList}`);
}

// ส่งออกฟังก์ชันที่สามารถใช้งานได้จากภายนอก
module.exports = {
  addItemToInventory,
  getInventory,
  showInventory,
};
