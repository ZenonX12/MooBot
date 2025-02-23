const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addItemToInventory } = require('./inventoryCommand'); // นำเข้าไฟล์ inventory.js

// ฟังก์ชันสุ่มไอเทม
function getRandomItem(user) {
  const items = [
    { name: 'ยาเพิ่มพลังชีวิต', description: 'เพิ่มพลังชีวิต 20 HP', effect: (userHp) => userHp + 20 },
    { name: 'ดาบเหล็ก', description: 'เพิ่มพลังโจมตี 5-15%', effect: (userAttack) => userAttack * 1.1 },
    { name: 'เกราะเหล็ก', description: 'เพิ่มพลังป้องกัน 10%', effect: (zombieHp) => zombieHp * 0.9 },
    { name: 'คาถาฟ้าผ่า', description: 'โจมตีทุกฝ่ายให้เสียหาย 10 HP', effect: (userHp, zombieHp) => {
      userHp = Math.max(userHp - 10, 0);
      zombieHp = Math.max(zombieHp - 10, 0);
      return { userHp, zombieHp };
    }}
  ];

  const item = items[Math.floor(Math.random() * items.length)];
  addItemToInventory(user.id, item); // เพิ่มไอเทมลงในอินเวนทอรี
  return item;
}

// ฟังก์ชันสร้าง Embed สำหรับการต่อสู้
function createBattleEmbed(user, zombie, userHp, zombieHp, description) {
  return new EmbedBuilder()
    .setTitle(`💥 การต่อสู้: ${user} vs ${zombie.name} 💥`)
    .setDescription(description)
    .setColor(userHp > 0 ? '#28a745' : '#dc3545')
    .setThumbnail(zombie.thumbnail || 'https://example.com/default-image.png')
    .addFields(
      { name: `${user} HP`, value: `**${userHp}**`, inline: true },
      { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
    );
}

// ฟังก์ชันคำนวณความเสียหาย
function calculateDamage(base, min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) + Math.floor(base / 10);
}

// ฟังก์ชันดึงรายชื่อซอมบี้
function getZombieList() {
  return [
    { name: 'Zombie ธรรมดา', hp: 60, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343106648046174293/eef0fd22941ee5b567796a0c244bdcb9.jpg' },
    { name: 'Zombie กลายพันธุ์', hp: 100, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107220262354964/64e72d558ced56bd1ab16bfbf808871a.jpg' },
    { name: 'Zombie ลึกลับ', hp: 80, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107425695301642/66ffc9cdf73935e7dae8e1e0f3b86480.jpg' },
  ];
}

// ฟังก์ชันสุ่มซอมบี้
function getRandomZombie() {
  const zombies = getZombieList();
  const isBossBattle = Math.random() < 0.1;
  return isBossBattle ? getBossZombie() : zombies[Math.floor(Math.random() * zombies.length)];
}

// ฟังก์ชันเลือกซอมบี้จากปุ่ม
function getSelectedZombie(customId) {
  if (customId === 'random') return getRandomZombie();
  if (customId === 'boss') return getBossZombie();
  return getZombieByName(customId);
}

// ฟังก์ชันตรวจสอบชื่อซอมบี้
function getZombieByName(name) {
  return getZombieList().find((zombie) => zombie.name === name);
}

// ฟังก์ชัน Boss Zombie
function getBossZombie() {
  return {
    name: 'Boss Zombie',
    hp: 150,
    thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107425695301642/66ffc9cdf73935e7dae8e1e0f3b86480.jpg',
    specialAbility: 'พลังแห่งความมืด! ทำให้ผู้เล่นได้รับความเสียหายสูงขึ้นในทุกๆ เทิร์น',
  };
}

// ฟังก์ชันสร้าง Embed เริ่มต้น
function createEmbed() {
  return new EmbedBuilder()
    .setTitle('🧟‍♂️ เลือก Zombie ที่คุณต้องการต่อสู้!')
    .setDescription('กดปุ่มเพื่อเลือก Zombie หรือสุ่ม!')
    .setColor('#FFA500');
}

// ฟังก์ชันสร้างปุ่มสำหรับเลือกซอมบี้
function createButtonRows() {
  const firstRow = new ActionRowBuilder().addComponents(
    ...getZombieList().slice(0, 3).map((zombie) =>
      new ButtonBuilder()
        .setCustomId(zombie.name)
        .setLabel(zombie.name)
        .setStyle(ButtonStyle.Primary)
    ),
    new ButtonBuilder().setCustomId('random').setLabel('🔄 สุ่ม').setStyle(ButtonStyle.Success)
  );

  const secondRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('boss').setLabel('💀 Boss Zombie').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('cancel').setLabel('❌ ยกเลิก').setStyle(ButtonStyle.Danger)
  );

  return [firstRow, secondRow];
}

// ฟังก์ชันเริ่มการต่อสู้
async function startBattle(message, user, zombie) {
  let userHp = 100;
  let zombieHp = zombie.hp;
  let turnCounter = 0;

  const battleMessage = await message.channel.send({
    embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, '⚔️ การต่อสู้เริ่มต้นขึ้น! ⚔️')],
  });

  while (userHp > 0 && zombieHp > 0) {
    turnCounter++;
    const userAttack = calculateDamage(userHp, 5, 20);
    const zombieAttack = calculateDamage(turnCounter, 5, 20);

    userHp = Math.max(userHp - zombieAttack, 0);
    zombieHp = Math.max(zombieHp - userAttack, 0);

    let battleText = `${user.username} โจมตี ${zombie.name} ⚔️ (-${userAttack} HP)\n${zombie.name} ตอบโต้! 🧟‍♂️ (-${zombieAttack} HP)`;

    // เพิ่มอีเวนต์พิเศษต่างๆ ในการต่อสู้
    if (Math.random() < 0.15) {
      battleText += `\n⚡ ฟ้าผ่า! ทั้ง ${user.username} และ ${zombie.name} ถูกโจมตี! ⚡`;
      userHp = Math.max(userHp - 10, 0);
      zombieHp = Math.max(zombieHp - 10, 0);
    }

    if (Math.random() < 0.1) {
      battleText += `\n🔥 ${user.username} ได้รับบัฟพิเศษ! เพิ่มพลังโจมตี! 🔥`;
    }

    if (Math.random() < 0.1) {
      battleText += `\n🛡️ ${zombie.name} ได้รับเกราะเพิ่มพลังป้องกัน! 🛡️`;
      zombieHp = Math.min(zombieHp + 10, zombie.hp);
    }

    if (zombie.name === 'Boss Zombie') {
      battleText += `\n💀 ${zombie.name} ใช้ความสามารถพิเศษ: ${zombie.specialAbility}! 💀`;
      userHp = Math.max(userHp - 15, 0);
    }

    await battleMessage.edit({
      embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, battleText)],
    });

    await new Promise((resolve) => setTimeout(resolve, 2000)); // เว้นเวลา 2 วินาที
  }

  let battleEndText = userHp > 0
    ? `🎉 ${user.username} ชนะการต่อสู้! 🎉`
    : `💀 ${user.username} พ่ายแพ้ให้กับ ${zombie.name}... 💀`;

  // สุ่มไอเทมหลังจากชนะ
  if (userHp > 0) {
    const item = getRandomItem(user);  // ส่ง user ไปยังฟังก์ชัน getRandomItem
    battleEndText += `\n🏆 ${user.username} ได้รับไอเทม: **${item.name}** - ${item.description}`;
  }

  await battleMessage.edit({
    embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, battleEndText)],
  });
}

// คำสั่งหลักสำหรับการเลือกและการต่อสู้
module.exports = {
  data: {
    name: '!zombie',
    description: 'คำสั่งที่เกี่ยวกับซอมบี้'
  },

  async execute(message) {
    const user = message.author;

    // สร้าง Embed เริ่มต้น
    const embed = createEmbed();

    // สร้างปุ่มเลือกซอมบี้
    const [firstRow, secondRow] = createButtonRows();

    // ส่งข้อความที่มีปุ่ม
    const selectionMessage = await message.channel.send({
      embeds: [embed],
      components: [firstRow, secondRow],
    });

    // ฟิลเตอร์และคอลเลกเตอร์สำหรับการคลิกปุ่ม
    const filter = (i) => i.user.id === user.id;
    const collector = selectionMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async (i) => {
      await i.deferUpdate();

      if (i.customId === 'cancel') {
        return collector.stop('cancelled');
      }

      const selectedZombie = getSelectedZombie(i.customId);
      if (!selectedZombie) return;

      collector.stop();
      await startBattle(message, user, selectedZombie);
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'cancelled') {
        selectionMessage.edit({
          embeds: [embed.setDescription('คุณได้ยกเลิกการเลือก!')],
          components: [],
        });
      } else {
        selectionMessage.edit({ components: [] });
      }
    });
  },
};
