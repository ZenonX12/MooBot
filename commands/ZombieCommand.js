const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: '!Zombie',
    description: 'เข้าร่วมการต่อสู้กับมอนสเตอร์ Zombie แบบสุ่ม!'
  },

  async execute(message) {
    // Log เพื่อให้รู้ว่าโค้ดถูกเรียกใช้งาน
    console.log('ZombieCommand executed');

    const user = message.author;

    // Randomly choose a Zombie for the user to fight
    const zombie = getRandomZombie();

    // Initialize player and zombie HP
    let userHp = 100;
    let zombieHp = zombie.hp;

    // Create an initial Embed to display the battle start
    let embed = new EmbedBuilder()
      .setTitle(`💥 การต่อสู้ระหว่าง ${user.username} กับ ${zombie.name}! 💥`)
      .setDescription(`เตรียมตัวเข้าสู่การต่อสู้! 🧟‍♂️⚔️`)
      .setColor('#FF5733')
      .setThumbnail(zombie.thumbnail)
      .addFields(
        { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
        { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
      );

    // Send the initial battle message with Embed
    let ZombieMessage = await message.channel.send({ embeds: [embed] });

    // Simulate the turn-based battle
    let turnCounter = 0;
    while (userHp > 0 && zombieHp > 0) {
      turnCounter++;

      // Player attack (damage increases based on player HP)
      const userAttack = Math.floor((Math.random() * 20) + 5) + Math.floor(userHp / 10);
      zombieHp -= userAttack;

      // Zombie attack (damage increases based on turn count)
      const zombieAttack = Math.floor((Math.random() * 20) + 5) + Math.floor(turnCounter / 2);
      userHp -= zombieAttack;

      // Ensure HP does not go below 0
      userHp = Math.max(userHp, 0);
      zombieHp = Math.max(zombieHp, 0);

      // Update the battle state with a new Embed after each turn
      embed = new EmbedBuilder()
        .setTitle(`💥 การต่อสู้ระหว่าง ${user.username} และ ${zombie.name}! 💥`)
        .setDescription(
          `${user.username} โจมตี ${zombie.name} ด้วยความเสียหาย ${userAttack}!\n` +
          `${zombie.name} โจมตี ${user.username} ด้วยความเสียหาย ${zombieAttack}!`
        )
        .setColor('#FF5733')
        .setThumbnail(zombie.thumbnail)
        .addFields(
          { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
          { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
        );

      await ZombieMessage.edit({ embeds: [embed] });
      await new Promise(resolve => setTimeout(resolve, 2000));  // Add a delay for turn pacing
    }

    // Generate the result message
    let resultMessage = '';
    let resultColor = userHp <= 0 ? '#dc3545' : '#28a745'; // Green if win, red if lose
    if (userHp <= 0) {
      resultMessage = `${user.username} ถูก ${zombie.name} ชนะ! 😞`;
    } else {
      resultMessage = `${user.username} ชนะ ${zombie.name}! 🎉`;
    }

    // Final result Embed
    embed = new EmbedBuilder()
      .setTitle(`🎉 ผลการต่อสู้: ${user.username} vs ${zombie.name} 🎉`)
      .setDescription(resultMessage)
      .setColor(resultColor)
      .setThumbnail(zombie.thumbnail)
      .addFields(
        { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
        { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
      );

    await ZombieMessage.edit({ embeds: [embed] });
  },
};

// Function to randomly select a Zombie
function getRandomZombie() {
  const zombies = [
    { name: 'Zombie ธรรมดา', hp: 60, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343106648046174293/eef0fd22941ee5b567796a0c244bdcb9.jpg' },
    { name: 'Zombie กลายพันธุ์', hp: 100, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107220262354964/64e72d558ced56bd1ab16bfbf808871a.jpg' },
    { name: 'Zombie ลึกลับ', hp: 80, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107425695301642/66ffc9cdf73935e7dae8e1e0f3b86480.jpg' },
  ];
  return zombies[Math.floor(Math.random() * zombies.length)];
}
