const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: {
    name: '!Zombie',
    description: 'เลือกมอนสเตอร์ Zombie ที่คุณจะต่อสู้ หรือสุ่ม!'
  },

  async execute(message) {
    const user = message.author;
    const embed = new EmbedBuilder()
      .setTitle('🧟‍♂️ เลือก Zombie ที่คุณต้องการต่อสู้!')
      .setDescription('กดปุ่มเพื่อเลือก Zombie หรือสุ่ม!')
      .setColor('#FFA500');

    const buttons = new ActionRowBuilder()
      .addComponents(
        ...getZombieList().map(zombie => new ButtonBuilder().setCustomId(zombie.name).setLabel(zombie.name).setStyle(ButtonStyle.Primary)),
        new ButtonBuilder().setCustomId('random').setLabel('🔄 สุ่ม').setStyle(ButtonStyle.Success)
      );

    const selectionMessage = await message.channel.send({
      embeds: [embed],
      components: [buttons],
      ephemeral: true,
    });

    const filter = i => i.user.id === user.id;
    const collector = selectionMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      await i.deferUpdate();
      const selectedZombie = i.customId === 'random' ? getRandomZombie() : getZombieByName(i.customId);
      if (!selectedZombie) return;

      collector.stop();
      await startBattle(message, user, selectedZombie);
    });

    collector.on('end', () => selectionMessage.edit({ components: [] }));
  },
};

async function startBattle(message, user, zombie) {
  let userHp = 100, zombieHp = zombie.hp;
  let turnCounter = 0;
  const battleMessage = await message.channel.send({ embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, '⚔️ การต่อสู้เริ่มต้นขึ้น! ⚔️')] });

  while (userHp > 0 && zombieHp > 0) {
    turnCounter++;
    const userAttack = calculateDamage(userHp, 5, 20);
    const zombieAttack = calculateDamage(turnCounter, 5, 20);

    userHp = Math.max(userHp - zombieAttack, 0);
    zombieHp = Math.max(zombieHp - userAttack, 0);

    let battleText = `${user.username} โจมตี ${zombie.name} ⚔️ (-${userAttack} HP)\n${zombie.name} ตอบโต้! 🧟‍♂️ (-${zombieAttack} HP)`;

    if (userHp < 30) battleText += `\n🔥 ${user.username} กำลังจะหมดแรง! 🔥`;
    if (zombieHp < 30) battleText += `\n💀 ${zombie.name} ใกล้ตายแล้ว! 💀`;

    if (Math.random() < 0.2) {
      battleText += `\n⚡ ฟ้าผ่า! ทั้ง ${user.username} และ ${zombie.name} ถูกโจมตี! ⚡`;
      userHp = Math.max(userHp - 10, 0);
      zombieHp = Math.max(zombieHp - 10, 0);
    }

    await battleMessage.edit({ embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, battleText)] });
    await new Promise(resolve => setTimeout(resolve, 2000)); // ทำให้การต่อสู้ราบรื่น
  }

  await battleMessage.edit({
    embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, 
      userHp > 0 ? `🎉 ${user.username} ชนะการต่อสู้! 🎉` : `💀 ${user.username} พ่ายแพ้ให้กับ ${zombie.name}... 💀`)]
  });
}

function getRandomZombie() {
  return getZombieList()[Math.floor(Math.random() * getZombieList().length)];
}

function getZombieByName(name) {
  return getZombieList().find(zombie => zombie.name === name);
}

function getZombieList() {
  return [
    { name: 'Zombie ธรรมดา', hp: 60, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343106648046174293/eef0fd22941ee5b567796a0c244bdcb9.jpg' },
    { name: 'Zombie กลายพันธุ์', hp: 100, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107220262354964/64e72d558ced56bd1ab16bfbf808871a.jpg' },
    { name: 'Zombie ลึกลับ', hp: 80, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107425695301642/66ffc9cdf73935e7dae8e1e0f3b86480.jpg' },
  ];
}

function calculateDamage(base, min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) + Math.floor(base / 10);
}

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
