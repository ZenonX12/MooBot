// fight.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: '!Zombie',
    description: 'เข้าร่วมการต่อสู้กับมอนสเตอร์ Zombie แบบสุ่ม!',
  },

  async execute(message) {
    const user = message.author;

    // สุ่มเลือก Zombie ที่ผู้ใช้จะต้องต่อสู้ด้วย
    const zombie = getRandomZombie();

    // กำหนดพลังชีวิตของผู้เล่นและ Zombie
    let userHp = 100;
    let zombieHp = zombie.hp;

    // สร้าง Embed เพื่อแสดงข้อความเริ่มต้นก่อนการต่อสู้
    let embed = new EmbedBuilder()
      .setTitle(`💥 การต่อสู้ระหว่าง ${user.username} กับ ${zombie.name}! 💥`)
      .setDescription(`เตรียมตัวเข้าสู่การต่อสู้! 🧟‍♂️⚔️`)
      .setColor('#FF5733')
      .setThumbnail(zombie.thumbnail) // เพิ่มรูป Thumbnail ของ Zombie
      .addFields(
        { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
        { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
      );

    // ส่งข้อความเริ่มต้นด้วย Embed
    let fightMessage = await message.channel.send({ embeds: [embed] });

    // จำลองการต่อสู้ในรูปแบบเทิร์น-เบส
    let turnCounter = 0;
    while (userHp > 0 && zombieHp > 0) {
      turnCounter++;

      // ผู้เล่นโจมตี (การโจมตีจะขึ้นอยู่กับ HP ของผู้เล่น)
      const userAttack = Math.floor((Math.random() * 20) + 5) + Math.floor(userHp / 10); // เพิ่มความแรงของการโจมตีตามพลังชีวิต
      zombieHp -= userAttack;

      // Zombie โจมตี (การโจมตีจะเพิ่มขึ้นตามจำนวนรอบที่ผ่านไป)
      const zombieAttack = Math.floor((Math.random() * 20) + 5) + Math.floor(turnCounter / 2); // Zombie จะมีพลังโจมตีที่เพิ่มขึ้นตามรอบ
      userHp -= zombieAttack;

      // สร้าง Embed ใหม่เพื่ออัปเดตข้อมูลทุกครั้ง
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

      await fightMessage.edit({ embeds: [embed] });

      await new Promise(resolve => setTimeout(resolve, 2000));  // เพิ่มเวลาในการหน่วงให้มากขึ้น

    }

    // สร้างข้อความผลการต่อสู้
    let resultMessage = '';
    let resultColor = '#28a745'; // สีเขียวสำหรับการชนะ
    if (userHp <= 0) {
      resultMessage = `${user.username} ถูก ${zombie.name} ชนะ! 😞`;
      resultColor = '#dc3545'; // สีแดงสำหรับการแพ้
    } else if (zombieHp <= 0) {
      resultMessage = `${user.username} ชนะ ${zombie.name}! 🎉`;
      resultColor = '#28a745'; // สีเขียวสำหรับการชนะ
    }

    // สร้าง Embed ใหม่พร้อมผลการต่อสู้
    embed = new EmbedBuilder()
      .setTitle(`🎉 ผลการต่อสู้: ${user.username} vs ${zombie.name} 🎉`)
      .setDescription(`${resultMessage}`)
      .setColor(resultColor)
      .setThumbnail(zombie.thumbnail)
      .addFields(
        { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
        { name: `${zombie.name} HP`, value: `**${zombieHp}**`, inline: true }
      );

    await fightMessage.edit({ embeds: [embed] });
  },
};

// ฟังก์ชันสำหรับสุ่มเลือก Zombie
function getRandomZombie() {
  const zombies = [
    { name: 'Zombie ธรรมดา', hp: 60, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343106648046174293/eef0fd22941ee5b567796a0c244bdcb9.jpg?ex=67bc110a&is=67babf8a&hm=14b302e108c19f8049b01198061a04a5d5ac3e2be4e84e1ebdc83960b293e59f&' },
    { name: 'Zombie กลายพันธุ์', hp: 100, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107220262354964/64e72d558ced56bd1ab16bfbf808871a.jpg?ex=67bc1193&is=67bac013&hm=4645a25087e266c62e383f7d8527ee3665d5ae2e8eb83f1c8c3380147b257421&' },
    { name: 'Zombie ลึกลับ', hp: 80, thumbnail: 'https://cdn.discordapp.com/attachments/1336344482005909575/1343107425695301642/66ffc9cdf73935e7dae8e1e0f3b86480.jpg?ex=67bc11c4&is=67bac044&hm=e7feec665cbb8e98a65618c7e1688cc01ced206b68708ebc234a94503f37b341&' },
  ];
  return zombies[Math.floor(Math.random() * zombies.length)];
}

// ฟังก์ชันสำหรับสุ่มค่าความเสียหายของการโจมตี (ระหว่าง 5 ถึง 25)
function getRandomAttack() {
  return Math.floor(Math.random() * 20) + 5; // ความเสียหายสุ่มระหว่าง 5 และ 25
}
