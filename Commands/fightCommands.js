const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const userStats = {}; // สถานะของผู้ใช้
const cooldowns = new Map(); // คูลดาวน์ระหว่างการใช้คำสั่ง
const inventory = {}; // คลังของผู้ใช้

module.exports = {
    name: 'fight',
    description: 'ตีมอนสเตอร์และรับของรางวัล',

    async execute(message, userBalance) {
        const userId = message.author.id;

        // คูลดาวน์ 5 วินาที
        const cooldownTime = 5 * 1000;
        if (cooldowns.has(userId)) {
            const lastUsed = cooldowns.get(userId);
            if (Date.now() - lastUsed < cooldownTime) {
                const remainingTime = ((cooldownTime - (Date.now() - lastUsed)) / 1000).toFixed(1);
                return message.reply(`⏳ กรุณารออีก ${remainingTime} วินาที`);
            }
        }
        cooldowns.set(userId, Date.now());

        // ถ้ายังไม่มีข้อมูลผู้ใช้ ให้เริ่มต้นใหม่
        if (!userStats[userId]) {
            userStats[userId] = { hp: 150, exp: 0, level: 1, maxHp: 150, attackBonus: 15 };
            inventory[userId] = [];  // สร้าง inventory ให้ผู้ใช้
        }
        let { hp, exp, level, maxHp, attackBonus } = userStats[userId];

        if (hp <= 0) {
            return message.reply('💀 คุณพลังชีวิตหมด! รอให้ฟื้นตัวก่อน!');
        }

        const monsters = [
            { name: 'Goblin', health: 50, attack: 5, reward: 20, exp: 25, image: 'https://example.com/goblin.png' },
            { name: 'Orc', health: 100, attack: 7, reward: 40, exp: 55, image: 'https://example.com/orc.png' },
            { name: 'Dragon', health: 200, attack: 12, reward: 100, exp: 120, image: 'https://example.com/dragon.png' },
            { name: 'Dark Knight (BOSS)', health: 500, attack: 20, reward: 300, exp: 250, rareDrop: 'Legendary Sword', image: 'https://example.com/darkknight.png' }
        ];

        // สร้างเมนูเลือกมอนสเตอร์
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('monsterSelect')
            .setPlaceholder('เลือกมอนสเตอร์ที่จะต่อสู้!')
            .addOptions(monsters.map(monster => ({
                label: monster.name,
                value: monster.name.toLowerCase(),
                description: `สุขภาพ: ${monster.health} HP, รางวัล: ${monster.reward} เหรียญ`,
                emoji: '⚔️',
            })));

        const fightIntroEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⚔️ เลือกมอนสเตอร์ที่จะต่อสู้!')
            .setDescription(`คุณพร้อมที่จะต่อสู้แล้ว! เลือกมอนสเตอร์ที่จะเข้าร่วมการต่อสู้:`)
            .setFooter({ text: 'กรุณาเลือกมอนสเตอร์จากเมนูด้านล่าง!' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // ส่ง Embed และ SelectMenu ให้ผู้ใช้เลือกมอนสเตอร์
        await message.reply({ embeds: [fightIntroEmbed], components: [row] });

        // ฟิลเตอร์เพื่อตรวจจับการเลือกเมนู
        const filter = (interaction) => interaction.user.id === message.author.id && interaction.isSelectMenu();

        try {
            const interaction = await message.channel.awaitMessageComponent({ filter, time: 30000 });

            const selectedMonsterName = interaction.values[0];
            const selectedMonster = monsters.find(m => m.name.toLowerCase() === selectedMonsterName);

            // ตรวจสอบว่ามอนสเตอร์ที่เลือกมีอยู่หรือไม่
            if (!selectedMonster) {
                return interaction.reply('❌ มอนสเตอร์ที่คุณเลือกไม่ถูกต้อง!');
            }

            // คำนวณการโจมตี
            let userCoins = userBalance[userId] || 0;
            let userAttack = Math.floor(Math.random() * 40) + 35 + attackBonus;
            let monsterAttack = Math.max(Math.floor(Math.random() * selectedMonster.attack) + (selectedMonster.attack / 3), 0);

            // เพิ่มโอกาสโจมตีคริติคอล
            if (Math.random() < 0.20) {
                userAttack *= 2;
            }

            let resultMessage = '';
            let embedColor = '#FF0000'; // สีเริ่มต้น

            // ตรวจสอบผลการต่อสู้
            if (userAttack >= selectedMonster.health) {
                let rewardCoins = Math.floor(selectedMonster.reward * 1.5);
                userCoins += rewardCoins;
                exp += Math.floor(selectedMonster.exp * 1.5);
                userBalance[userId] = userCoins;

                resultMessage = `🎉 คุณชนะ **${selectedMonster.name}**! ได้รับ **${rewardCoins}** 💰 และ **${exp}** XP!`;

                // เลเวลอัป
                if (exp >= level * 50) {
                    level += 1;
                    exp = 0;
                    maxHp += 15;
                    hp = maxHp;
                    resultMessage += `\n🆙 **เลเวลอัปเป็น Lv.${level}**! พลังชีวิตสูงสุดเพิ่มเป็น **${maxHp} HP**!`;
                }

                // รับไอเทมหายาก
                if (selectedMonster.rareDrop && Math.random() < 0.15) {
                    inventory[userId].push(selectedMonster.rareDrop);
                    resultMessage += `\n🎁 คุณได้รับไอเทมหายาก: **${selectedMonster.rareDrop}**!`;
                }

                embedColor = '#28a745'; // สีเขียวเมื่อชนะ
            } else {
                hp -= monsterAttack;
                if (hp <= 0) {
                    hp = 0;
                    resultMessage = `💀 คุณแพ้ **${selectedMonster.name}** และพลังชีวิตหมด!`;
                } else {
                    resultMessage = `💔 คุณแพ้ **${selectedMonster.name}**! โดนโจมตี **-${monsterAttack} HP** เหลือ **${hp} HP**`;
                }
            }

            // อัปเดตสถานะผู้ใช้
            userStats[userId] = { hp, exp, level, maxHp, attackBonus };

            // โอกาสได้รับยาฟื้นฟู
            if (Math.random() < 0.25 && hp > 0) {
                let healAmount = Math.floor(Math.random() * 25) + 20;
                hp += healAmount;
                if (hp > maxHp) hp = maxHp;
                resultMessage += `\n💖 คุณได้รับ **ยาฟื้นฟู ${healAmount} HP**! ตอนนี้มี **${hp} HP**`;
                userStats[userId].hp = hp;
            }

            // สร้าง Embed สำหรับผลการต่อสู้
            const fightEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`⚔️ ต่อสู้กับ ${selectedMonster.name}`)
                .setDescription(resultMessage)
                .setImage(selectedMonster.image)
                .addFields(
                    { name: '🛡️ มอนสเตอร์', value: selectedMonster.name, inline: true },
                    { name: '❤️ HP ของคุณ', value: `${hp}/${maxHp} HP`, inline: true },
                    { name: '💰 เหรียญที่คุณมี', value: `${userCoins} เหรียญ`, inline: true },
                    { name: '🎲 การโจมตี', value: `คุณโจมตี: ${userAttack}\nมอนสเตอร์โจมตี: ${monsterAttack}`, inline: false },
                    { name: '🆙 เลเวล', value: `**Lv. ${level}** (${exp}/${level * 50} XP)`, inline: false }
                )
                .setFooter({ text: 'พยายามใหม่เพื่อฝึกฝนตัวเอง!' })
                .setTimestamp();

            // ส่ง Embed
            await interaction.update({ embeds: [fightEmbed], components: [] });

        } catch (error) {
            console.error('Error during the fight interaction:', error);
            message.reply('⏳ หมดเวลาสำหรับการเลือกมอนสเตอร์! ลองใหม่อีกครั้ง.');
        }
    },
};
