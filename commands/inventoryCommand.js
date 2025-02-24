const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let inventories = {}; // เก็บข้อมูลอินเวนทอรีของผู้เล่น
const ITEMS_PER_PAGE = 5; // จำนวนไอเทมต่อหน้า

// ฟังก์ชันเพิ่มไอเทมลงในอินเวนทอรี
function addItemToInventory(userId, item) {
  if (!inventories[userId]) {
    inventories[userId] = [];
  }
  inventories[userId].push(item);
  console.log(`Received ${item.name} from ${userId}`);
}

// ฟังก์ชันดึงข้อมูลอินเวนทอรีของผู้ใช้
function getInventory(userId) {
  return inventories[userId] || [];
}

// ฟังก์ชันแสดงอินเวนทอรี พร้อมปุ่มเลื่อนหน้า
async function showInventory(message, page = 1) {
  const userId = message.author.id;
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
    .setColor('#4CAF50') // สีเขียวดูสดใส
    .setThumbnail(message.author.avatarURL())
    .setDescription(`Showing items **${start + 1} - ${Math.min(end, userInventory.length)}** out of **${userInventory.length}**`)
    .setFooter({ text: `Page ${page} of ${totalPages}` })
    .setTimestamp();

  // เพิ่มไอเทมลงใน Embed
  itemsOnPage.forEach((item, index) => {
    inventoryEmbed.addFields({
      name: `🔹 ${item.name}`,
      value: `💬 **Description:** ${item.description}\n🎭 **Type:** ${item.type}\n✨ **Rarity:** ${item.rarity}`,
      inline: false,
    });
  });

  // ปุ่มเลื่อนหน้า
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
      .setDisabled(page === totalPages)
  );

  // ส่ง Embed และปุ่ม
  const reply = await message.reply({ embeds: [inventoryEmbed], components: [row] });

  // ตัวจับปุ่มกดสำหรับเลื่อนหน้า
  const filter = (interaction) => interaction.customId.startsWith(`prev_page_${userId}_`) || interaction.customId.startsWith(`next_page_${userId}_`);
  const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ **You can't interact with this inventory!**", ephemeral: true });
    }

    let newPage = page;
    if (interaction.customId.startsWith('prev_page_')) newPage--;
    if (interaction.customId.startsWith('next_page_')) newPage++;

    await showInventory(interaction, newPage);
    await interaction.deferUpdate();
  });

  collector.on('end', () => {
    reply.edit({ components: [] }).catch(() => {});
  });
}

// ส่งออกฟังก์ชันที่สามารถใช้งานได้จากภายนอก
module.exports = {
  addItemToInventory,
  getInventory,
  showInventory,
};
