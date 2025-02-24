const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addItemToInventory } = require('./inventoryCommand');
const axios = require('axios');

const BASE_HP = 100;
const BASE_ATTACK = { min: 5, max: 15 };
const BASE_SPEED = 10;

function generateCustomId(prefix, zombieName) {
  // Creating a unique Custom ID using the prefix and zombieName along with timestamp
  return `${prefix}_${zombieName}_${Date.now()}`;
}

function createBattleEmbed(user, zombie, userHp, zombieHp, userSpeed, zombieSpeed, description) {
  return new EmbedBuilder()
    .setTitle(`⚔️ ${user} vs ${zombie.name} 🧟`)
    .setDescription(description)
    .setColor(userHp > 0 ? '#2ECC71' : '#E74C3C')
    .setThumbnail(zombie.thumbnail || 'https://example.com/default-thumbnail.jpg') // Default thumbnail if not available
    .addFields(
      { name: `❤️ ${user} HP`, value: `**${userHp}**`, inline: true },
      { name: `🧟‍♂️ ${zombie.name} HP`, value: `**${zombieHp}**`, inline: true },
      { name: `⚡ ความเร็ว`, value: `**${userSpeed} vs ${zombieSpeed}**`, inline: false }
    );
}

function calculateDamage(base, min, max) {
  const damage = Math.floor(Math.random() * (max - min + 1) + min) + Math.floor(base / 10);
  return Math.max(damage, 0); // Ensure that damage is not negative
}

function getZombieList() {
  return [
    { name: '🧟 Zombie ธรรมดา', hp: 60, attack: 8, speed: 8, thumbnail: 'https://example.com/zombie1.jpg' },
    { name: '🧟‍♂️ Zombie กลายพันธุ์', hp: 100, attack: 12, speed: 6, thumbnail: 'https://example.com/zombie2.jpg' },
    { name: '🧛 Zombie ลึกลับ', hp: 80, attack: 10, speed: 12, thumbnail: 'https://example.com/zombie3.jpg' },
  ];
}

function getRandomZombie() {
  return getZombieList()[Math.floor(Math.random() * getZombieList().length)];
}

async function sendToWebhook(title, message, color = '#FF0000') {
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setTimestamp();

    await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`❌ Webhook Error: ${error.message}`);
    console.error(`Webhook URL: ${process.env.DISCORD_WEBHOOK_URL}`);
  }
}

async function startBattle(message, user, zombie) {
  let userHp = BASE_HP;
  let zombieHp = zombie.hp;
  let userSpeed = BASE_SPEED;
  let zombieSpeed = zombie.speed;

  const battleMessage = await message.channel.send({
    embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, userSpeed, zombieSpeed, '⚔️ เริ่มต่อสู้!')]
  });

  while (userHp > 0 && zombieHp > 0) {
    const isUserFaster = userSpeed >= zombieSpeed;

    // Handle user attack
    if (isUserFaster) {
      const userAttack = calculateDamage(userHp, BASE_ATTACK.min, BASE_ATTACK.max);
      zombieHp = Math.max(zombieHp - userAttack, 0);
    }

    // Handle zombie attack if still alive
    if (zombieHp > 0) {
      const zombieAttack = calculateDamage(zombieHp, zombie.attack - 3, zombie.attack);
      userHp = Math.max(userHp - zombieAttack, 0);
    }

    // Update the battle embed message
    await battleMessage.edit({
      embeds: [
        createBattleEmbed(
          user.username, zombie, userHp, zombieHp, userSpeed, zombieSpeed,
          `🗡️ ${user.username} โจมตี! (-${userHp} HP)\n🧟 ${zombie.name} ตอบโต้! (-${zombieHp} HP)`
        ),
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  let battleEndText = userHp > 0
    ? `🎉 ${user.username} ชนะ! ได้รับรางวัล!`
    : `💀 ${user.username} ถูกกำจัดโดย ${zombie.name}...`;

  // Reward if user wins
  if (userHp > 0) {
    const reward = {
      id: 'healing_potion',
      name: 'ยาเพิ่มพลัง',
      description: 'ฟื้นฟูพลังชีวิต 20 HP',
      type: 'consumable',
      rarity: 'common',
      value: 20
    };

    // Ensure reward is valid
    if (reward && reward.id && reward.name && reward.value) {
      addItemToInventory(user.id, reward);
      battleEndText += `\n🏆 **ได้รับไอเทม:** ${reward.name} - ฟื้นฟูพลังชีวิต ${reward.value} HP`;
    } else {
      console.error('❌ Invalid reward item:', reward);
    }
  }

  await battleMessage.edit({
    embeds: [createBattleEmbed(user.username, zombie, userHp, zombieHp, userSpeed, zombieSpeed, battleEndText)],
  });
}

module.exports = {
  data: {
    name: '!zombie',
    description: 'เลือกซอมบี้เพื่อต่อสู้'
  },

  async execute(message) {
    const user = message.author;
    const embed = new EmbedBuilder().setTitle('🧟 เลือก Zombie ที่ต้องการต่อสู้!').setColor('#FFA500');
    const zombies = getZombieList();

    const buttons = zombies.map((zombie) =>
      new ButtonBuilder().setCustomId(generateCustomId('zombie', zombie.name)).setLabel(zombie.name).setStyle(ButtonStyle.Primary)
    );
    buttons.push(
      new ButtonBuilder().setCustomId('random').setLabel('🔄 สุ่ม').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('cancel').setLabel('❌ ยกเลิก').setStyle(ButtonStyle.Danger)
    );

    const actionRow = new ActionRowBuilder().addComponents(buttons);
    const selectionMessage = await message.channel.send({ embeds: [embed], components: [actionRow] });

    const filter = (i) => i.user.id === user.id;
    const collector = selectionMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async (i) => {
      await i.deferUpdate();
      if (i.customId === 'cancel') return collector.stop('cancelled');

      let selectedZombie;
      if (i.customId === 'random') {
        selectedZombie = getRandomZombie();
      } else {
        selectedZombie = zombies.find((zombie) => generateCustomId('zombie', zombie.name) === i.customId); // Compare custom ID
      }

      if (!selectedZombie) {
        console.error('Error: Selected zombie is undefined.');
        await sendToWebhook('⚠️ Error in Battle', `Selected zombie is undefined. Custom ID: ${i.customId}`, '#FF0000');
        return;
      }

      collector.stop();
      await startBattle(message, user, selectedZombie);
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'cancelled') {
        selectionMessage.edit({ embeds: [embed.setDescription('🚫 คุณยกเลิกการเลือก!')], components: [] });
      } else {
        selectionMessage.edit({ components: [] });
      }
    });
  },
};
