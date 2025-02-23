const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: {
    name: '!Zombie',
    description: 'เลือกมอนสเตอร์ Zombie ที่คุณจะต่อสู้ หรือสุ่ม!'
  },

  async execute(message) {
    console.log('ZombieCommand executed');

    const user = message.author;

    // 🔹 สร้าง Embed ให้ผู้ใช้เลือก Zombie
    let embed = new EmbedBuilder()
      .setTitle('🧟‍♂️ เลือก Zombie ที่คุณต้องการต่อสู้!')
      .setDescription('กดปุ่มเพื่อเลือก Zombie หรือสุ่ม!')
      .setColor('#FFA500');

    // 🔹 สร้างปุ่มให้เลือกประเภท Zombie
    const buttons = new ActionRowBuilder()
      .addComponents(
        ...getZombieList(true).map(zombie =>
          new ButtonBuilder()
            .setCustomId(zombie.name)
            .setLabel(zombie.name)
            .setStyle(ButtonStyle.Primary)
        ),
        new ButtonBuilder()
          .setCustomId('random')
          .setLabel('🔄 สุ่ม')
          .setStyle(ButtonStyle.Success)
      );

    // 🔹 ส่งข้อความให้ผู้ใช้เลือก
    const selectionMessage = await message.channel.send({
      embeds: [embed],
      components: [buttons],
      ephemeral: true, // ทำให้ข้อความนี้แสดงเฉพาะผู้ใช้ที่เรียกคำสั่ง
    });

    // ✅ รอให้ผู้ใช้กดปุ่มเลือก Zombie
    const filter = i => i.user.id === user.id;
    const collector = selectionMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      await i.deferUpdate();

      let selectedZombie = i.customId === 'random' ? getRandomZombie() : getZombieByName(i.customId);
      if (!selectedZombie) return;

      collector.stop(); // ปิดการฟังปุ่ม

      await startBattle(message, user, selectedZombie);
    });

    collector.on('end', () => selectionMessage.edit({ components: [] })); // ปิดปุ่มเมื่อหมดเวลา
  },
};

// 🎮 ฟังก์ชันเริ่มการต่อสู้
async function startBattle(message, user, zombie) {
  let userHp = 100, zombieHp = zombie.hp;
  let embed = createBattleEmbed(user.username, zombie, userHp, zombieHp, '⚔️ เริ่มการต่อสู้! ⚔️');
  let battleMessage = await message.channel.send({ embeds: [embed] });

  let turnCounter = 0;
  while (userHp > 0 && zombieHp > 0) {
    turnCounter++;
    const userAttack = getDamage(userHp, 5, 20);
    const zombieAttack = getDamage(turnCounter, 5, 20);

    zombieHp = Math.max(zombieHp - userAttack, 0);
    userHp = Math.max(userHp - zombieAttack, 0);

    embed = createBattleEmbed(user.username, zombie, userHp, zombieHp,
      `${user.username} โจมตี ${zombie.name} ⚔️ (-${userAttack} HP)\n${zombie.name} ตอบโต้! 🧟‍♂️ (-${zombieAttack} HP)`);

    await battleMessage.edit({ embeds: [embed] });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  embed = createBattleEmbed(user.username, zombie, userHp, zombieHp,
    userHp > 0 ? `🎉 ${user.username} ชนะการต่อสู้!` : `💀 ${user.username} พ่ายแพ้ให้กับ ${zombie.name}...`);
  await battleMessage.edit({ embeds: [embed] });
}

// 🧟 ฟังก์ชันสุ่ม Zombie
function getRandomZombie() {
  const zombies = getZombieList(true);
  return zombies[Math.floor(Math.random() * zombies.length)];
}

// 🔍 เลือก Zombie ตามชื่อ
function getZombieByName(name) {
  return getZombieList(true).find(zombie => zombie.name === name);
}

// 📜 แสดงรายการ Zombie ที่เลือกได้
function getZombieList(onlyData = false) {
  const zombies = [
    { name: 'Zombie ธรรมดา', hp: 60, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343106648046174293/eef0fd22941ee5b567796a0c244bdcb9.jpg' },
    { name: 'Zombie กลายพันธุ์', hp: 100, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107220262354964/64e72d558ced56bd1ab16bfbf808871a.jpg' },
    { name: 'Zombie ลึกลับ', hp: 80, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107425695301642/66ffc9cdf73935e7dae8e1e0f3b86480.jpg' },
  ];
  return onlyData ? zombies : zombies.map(z => `- ${z.name}`).join('\n');
}

// 🎭 คำนวณดาเมจ
function getDamage(base, min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) + Math.floor(base / 10);
}

// 🎨 สร้าง Embed สำหรับการต่อสู้
function createBattleEmbed(user, zombie, userHp, zombieHp, description) {
  return new EmbedBuilder()
    .setTitle(`💥 การต่อสู้: ${user} vs ${zombie.name} 💥`)
    .setDescription(description)
    .setColor(userHp > 0 ? '#28a745' : '#dc3545')
    .setThumbnail(zombie.thumbnail)
    .addFields(
      { name: `${user} HP`, value: `**${userHp}**`, inline: true },
      { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
    );
}
