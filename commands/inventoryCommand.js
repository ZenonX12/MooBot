const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let inventories = {}; // เก็บข้อมูลอินเวนทอรีของผู้เล่น
const ITEMS_PER_PAGE = 5; // จำนวนไอเทมต่อหน้า
const MAX_ITEMS = 100; // กำหนดจำนวนสูงสุดของไอเทมใน inventory

// ฟังก์ชันเพิ่มไอเทมลงในอินเวนทอรี
function addItemToInventory(userId, item) {
  if (!item || !item.name || !item.description || !item.type || !item.rarity) {
    console.error("❌ Invalid item structure:", item);
    return "❌ Item is invalid!";
  }

  if (!inventories[userId]) {
    inventories[userId] = [];
  }

  if (inventories[userId].length >= MAX_ITEMS) {
    return "🚫 Your inventory is full!";
  }

  inventories[userId].push(item);
  console.log(`✅ Added ${item.name} to ${userId}'s inventory`);
  return `🎉 **${item.name}** has been added to your inventory!`;
}

// ฟังก์ชันดึงข้อมูลอินเวนทอรีของผู้ใช้
function getInventory(userId) {
  return inventories[userId] || [];
}

// ฟังก์ชันแสดงอินเวนทอรี พร้อมปุ่มเลื่อนหน้า
async function showInventory(message, page = 1) {
  const userId = message.author.id;
  if (!userId) return; // ตรวจสอบว่ามี userId หรือไม่

  const userInventory = getInventory(userId);

  if (!userInventory.length) {
    return message.reply("🚫 **Your inventory is empty!**");
  }

  const totalPages = Math.ceil(userInventory.length / ITEMS_PER_PAGE);
  page = Math.max(1, Math.min(page, totalPages)); // ตรวจสอบให้หน้าอยู่ในช่วงที่ถูกต้อง

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const itemsOnPage = userInventory.slice(start, end);

  const inventoryEmbed = new EmbedBuilder()
    .setTitle(`📦 ${message.author.username}'s Inventory`)
    .setColor('#2ECC71') // สีเขียวสดใส
    .setThumbnail(message.author.avatarURL())
    .setDescription(`📜 Showing items **${start + 1} - ${Math.min(end, userInventory.length)}** out of **${userInventory.length}**`)
    .setFooter({ text: `Page ${page} of ${totalPages} • Max ${MAX_ITEMS} items` })
    .setTimestamp();

  // เพิ่มไอเทมลงใน Embed
  itemsOnPage.forEach((item, index) => {
    inventoryEmbed.addFields({
      name: `🔹 ${item.name} (${item.rarity})`,
      value: `💬 **${item.description}**\n🎭 **Type:** ${item.type}`,
      inline: false,
    });
  });

  // ปุ่มควบคุม
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`prev_page_${userId}_${page}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),
    
    new ButtonBuilder()
      .setCustomId(`next_page_${userId}_${page}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages),

    new ButtonBuilder()
      .setCustomId(`close_inventory_${userId}`)
      .setLabel('🔴 Close')
      .setStyle(ButtonStyle.Danger)
  );

  // ส่ง Embed และปุ่ม
  const reply = await message.reply({ embeds: [inventoryEmbed], components: [row] });

  // ตัวจับปุ่มกด
  const filter = (interaction) => interaction.user.id === userId;
  const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async (interaction) => {
    if (interaction.customId === `close_inventory_${userId}`) {
      await interaction.update({ content: "🛑 **Inventory closed!**", embeds: [], components: [] });
      return;
    }

    let newPage = page;
    if (interaction.customId.startsWith('prev_page_')) newPage--;
    if (interaction.customId.startsWith('next_page_')) newPage++;

    await showInventory(interaction, newPage);
    await interaction.deferUpdate();
  });

  collector.on('end', () => {
    reply.edit({ components: [] }).catch(() => {}); // ปรับให้แก้ไขปุ่มเมื่อเวลาเกิน
  });
}

// ส่งออกฟังก์ชันที่สามารถใช้งานได้จากภายนอก
module.exports = {
  addItemToInventory,
  getInventory,
  showInventory,
};
