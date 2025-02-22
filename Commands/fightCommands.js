const { EmbedBuilder } = require('discord.js');

const userStats = {};
const cooldowns = new Map();
const inventory = {};

module.exports = {
    name: 'fight',
    description: 'ตีมอนสเตอร์และรับของรางวัล',

    execute(message, userBalance) {
        const userId = message.author.id;

        // 🔥 ลดคูลดาวน์จาก 10s → 5s
        const cooldownTime = 5 * 1000;
        if (cooldowns.has(userId)) {
            const lastUsed = cooldowns.get(userId);
            if (Date.now() - lastUsed < cooldownTime) {
                return message.reply(`⏳ กรุณารออีก ${((cooldownTime - (Date.now() - lastUsed)) / 1000).toFixed(1)} วินาที`);
            }
        }
        cooldowns.set(userId, Date.now());

        if (!userStats[userId]) {
            userStats[userId] = { hp: 150, exp: 0, level: 1, maxHp: 150, attackBonus: 15 };
            inventory[userId] = [];
        }
        let { hp, exp, level, maxHp, attackBonus } = userStats[userId];

        if (hp <= 0) {
            return message.reply('💀 คุณพลังชีวิตหมด! รอให้ฟื้นตัวก่อน!');
        }

        const monsters = [
            { name: 'Goblin', health: 50, attack: 5, reward: 20, exp: 25 },
            { name: 'Orc', health: 100, attack: 7, reward: 40, exp: 55 },
            { name: 'Dragon', health: 200, attack: 12, reward: 100, exp: 120 },
            { name: 'Dark Knight (BOSS)', health: 500, attack: 20, reward: 300, exp: 250, rareDrop: 'Legendary Sword' }
        ];

        const monster = monsters[Math.floor(Math.random() * monsters.length)];
        let userCoins = userBalance[userId] || 0;

        // 🔥 ปรับดาเมจขั้นต่ำจาก 30 → 35 และเพิ่มโอกาสคริติคอลเป็น 20%
        let userAttack = Math.floor(Math.random() * 40) + 35 + attackBonus;
        let monsterAttack = Math.floor(Math.random() * monster.attack) + (monster.attack / 3);

        if (Math.random() < 0.20) {
            userAttack *= 2;
        }

        let resultMessage = '';
        let embedColor = '#FF0000';

        if (userAttack >= monster.health) {
            let rewardCoins = Math.floor(monster.reward * 1.5);
            userCoins += rewardCoins;
            exp += Math.floor(monster.exp * 1.5);
            userBalance[userId] = userCoins;

            resultMessage = `🎉 คุณชนะ **${monster.name}**! ได้รับ **${rewardCoins}** 💰 และ **${exp}** XP!`;

            if (exp >= level * 50) {
                level += 1;
                exp = 0;
                maxHp += 15;
                hp = maxHp;
                resultMessage += `\n🆙 **เลเวลอัปเป็น ${level}**! พลังชีวิตสูงสุดเพิ่มเป็น **${maxHp} HP**!`;
            }
            
            if (monster.rareDrop && Math.random() < 0.15) {
                inventory[userId].push(monster.rareDrop);
                resultMessage += `\n🎁 คุณได้รับไอเทมหายาก: **${monster.rareDrop}**!`;
            }
            
            embedColor = '#28a745';
        } else {
            hp -= monsterAttack;
            if (hp <= 0) {
                hp = 0;
                resultMessage = `💀 คุณแพ้ **${monster.name}** และพลังชีวิตหมด!`;
            } else {
                resultMessage = `💔 คุณแพ้ **${monster.name}**! โดนโจมตี **-${monsterAttack} HP** เหลือ **${hp} HP**`;
            }
        }

        userStats[userId] = { hp, exp, level, maxHp, attackBonus };

        if (Math.random() < 0.25 && hp > 0) {
            let healAmount = Math.floor(Math.random() * 25) + 20;
            hp += healAmount;
            if (hp > maxHp) hp = maxHp;
            resultMessage += `\n💖 คุณได้รับ **ยาฟื้นฟู ${healAmount} HP!** ตอนนี้มี ${hp} HP`;
            userStats[userId].hp = hp;
        }

        const fightEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`⚔️ ต่อสู้กับ ${monster.name}`)
            .setDescription(resultMessage)
            .addFields(
                { name: '🛡️ มอนสเตอร์', value: monster.name, inline: true },
                { name: '❤️ HP ของคุณ', value: `${hp}/${maxHp} HP`, inline: true },
                { name: '💰 เหรียญที่คุณมี', value: `${userCoins} เหรียญ`, inline: true },
                { name: '🎲 การโจมตี', value: `คุณโจมตี: ${userAttack} \n มอนสเตอร์โจมตี: ${monsterAttack}`, inline: false },
                { name: '🆙 เลเวล', value: `**Lv. ${level}** (${exp}/ ${level * 50} XP)`, inline: false }
            )
            .setFooter({ text: 'พยายามใหม่เพื่อฝึกฝนตัวเอง!' })
            .setTimestamp();

        message.reply({ embeds: [fightEmbed] });
    },
};
