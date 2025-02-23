// fight.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: '!fight',
    description: 'เข้าร่วมการต่อสู้กับมอนสเตอร์แบบสุ่ม!',
  },

  async execute(message) {
    const user = message.author;

    // สุ่มเลือกมอนสเตอร์ที่ผู้ใช้จะต้องต่อสู้ด้วย
    const monster = getRandomMonster();

    // กำหนดพลังชีวิตของผู้เล่นและมอนสเตอร์
    let userHp = 100;
    let monsterHp = monster.hp;

    // สร้าง Embed เพื่อแสดงข้อความเริ่มต้นก่อนการต่อสู้
    let embed = new EmbedBuilder()
      .setTitle(`${user.username} กับมอนสเตอร์ ${monster.name}!`)
      .setDescription(`เตรียมตัวเข้าสู่การต่อสู้! 🧟‍♂️⚔️`)
      .setColor('#FF0000')
      .addFields(
        { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
        { name: `${monster.name} HP`, value: `**${monsterHp}**`, inline: true }
      );

    // ส่งข้อความเริ่มต้นด้วย Embed
    let fightMessage = await message.channel.send({ embeds: [embed] });

    // จำลองการต่อสู้ในรูปแบบเทิร์น-เบส
    while (userHp > 0 && monsterHp > 0) {
      // ผู้เล่นโจมตี
      const userAttack = getRandomAttack();
      monsterHp -= userAttack;

      // มอนสเตอร์โจมตี
      const monsterAttack = getRandomAttack();
      userHp -= monsterAttack;

      // สร้าง Embed ใหม่เพื่ออัปเดตข้อมูลทุกครั้ง
      embed = new EmbedBuilder()
        .setTitle(`${user.username} กับมอนสเตอร์ ${monster.name}!`)
        .setDescription(
          `${user.username} โจมตี ${monster.name} ด้วยความเสียหาย ${userAttack}!\n` +
          `${monster.name} โจมตี ${user.username} ด้วยความเสียหาย ${monsterAttack}!`
        )
        .setColor('#FF0000')
        .addFields(
          { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
          { name: `${monster.name} HP`, value: `**${monsterHp}**`, inline: true }
        );

      await fightMessage.edit({ embeds: [embed] });

      await new Promise(resolve => setTimeout(resolve, 1000));  // จำลองการหน่วงเวลา
    }

    // สร้างข้อความผลการต่อสู้
    let resultMessage = '';
    if (userHp <= 0) {
      resultMessage = `${user.username} ถูก ${monster.name} ชนะ! 😞`;
    } else if (monsterHp <= 0) {
      resultMessage = `${user.username} ชนะ ${monster.name}! 🎉`;
    }

    // สร้าง Embed ใหม่พร้อมผลการต่อสู้
    embed = new EmbedBuilder()
      .setTitle(`${user.username} กับมอนสเตอร์ ${monster.name}!`)
      .setDescription(`${resultMessage}`)
      .setColor('#FF0000')
      .addFields(
        { name: `${user.username} HP`, value: `**${userHp}**`, inline: true },
        { name: `${monster.name} HP`, value: `**${monsterHp}**`, inline: true }
      );

    await fightMessage.edit({ embeds: [embed] });
  },
};

// ฟังก์ชันสำหรับสุ่มเลือกมอนสเตอร์
function getRandomMonster() {
  // เปลี่ยนมอนสเตอร์ทั้งหมดเป็น Zombie
  const monsters = [
    { name: 'Zombie', hp: 60 },
  ];
  return monsters[Math.floor(Math.random() * monsters.length)];
}

// ฟังก์ชันสำหรับสุ่มค่าความเสียหายของการโจมตี (ระหว่าง 5 ถึง 25)
function getRandomAttack() {
  return Math.floor(Math.random() * 20) + 5; // ความเสียหายสุ่มระหว่าง 5 และ 25
}
