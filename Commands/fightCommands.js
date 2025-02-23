const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

const userStats = {};
const cooldowns = new Map();
const inventory = {};
const userBalance = {}; // คลังเหรียญของผู้ใช้
const dataFile = './userData.json';

// โหลดข้อมูลจากไฟล์ JSON
function loadUserData() {
    if (fs.existsSync(dataFile)) {
        try {
            const data = fs.readFileSync(dataFile);
            const parsedData = JSON.parse(data);
            Object.assign(userStats, parsedData.userStats);
            Object.assign(userBalance, parsedData.userBalance);
            Object.assign(inventory, parsedData.inventory);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
}

// บันทึกข้อมูลลงไฟล์ JSON
function saveUserData() {
    try {
        fs.writeFileSync(dataFile, JSON.stringify({ userStats, userBalance, inventory }, null, 2));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

module.exports = {
    name: 'fight',
    description: 'ตีมอนสเตอร์และรับของรางวัล',

    async execute(message) {
        const userId = message.author.id;

        // คูลดาวน์ 5 วินาที
        const cooldownTime = 5000;
        if (cooldowns.has(userId) && (Date.now() - cooldowns.get(userId) < cooldownTime)) {
            const remainingTime = ((cooldownTime - (Date.now() - cooldowns.get(userId))) / 1000).toFixed(1);
            return message.reply(`⏳ กรุณารออีก ${remainingTime} วินาที`);
        }
        cooldowns.set(userId, Date.now());

        // ตรวจสอบว่าผู้ใช้มีข้อมูลหรือยัง
        if (!userStats[userId]) {
            userStats[userId] = { hp: 150, exp: 0, level: 1, maxHp: 150, attackBonus: 15 };
            inventory[userId] = [];
            userBalance[userId] = 0;
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

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('monsterSelect')
            .setPlaceholder('เลือกมอนสเตอร์!')
            .addOptions(monsters.map(monster => ({
                label: monster.name,
                value: monster.name.toLowerCase(),
                description: `HP: ${monster.health}, รางวัล: ${monster.reward}💰`,
                emoji: '⚔️',
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const fightEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⚔️ เลือกมอนสเตอร์ที่จะต่อสู้!')
            .setFooter({ text: 'กรุณาเลือกมอนสเตอร์จากเมนูด้านล่าง!' })
            .setTimestamp();

        const fightMessage = await message.reply({ embeds: [fightEmbed], components: [row] });

        try {
            const interaction = await fightMessage.channel.awaitMessageComponent({ filter: (i) => i.user.id === userId, time: 30000 });
            const selectedMonster = monsters.find(m => m.name.toLowerCase() === interaction.values[0]);
            if (!selectedMonster) return interaction.reply('❌ มอนสเตอร์ที่คุณเลือกไม่ถูกต้อง!');

            let userCoins = userBalance[userId] || 0;
            let userAttack = Math.floor(Math.random() * 40) + 35 + attackBonus;
            let monsterAttack = Math.floor(Math.random() * (selectedMonster.attack * 0.5)) + (selectedMonster.attack * 0.5);

            if (Math.random() < 0.20) userAttack *= 2;
            let resultMessage = '';
            let embedColor = '#FF0000';

            if (userAttack >= selectedMonster.health) {
                let rewardCoins = Math.floor(selectedMonster.reward * 1.5);
                userCoins += rewardCoins;
                exp += Math.floor(selectedMonster.exp * 1.5);
                userBalance[userId] = userCoins;

                resultMessage = `🎉 คุณชนะ **${selectedMonster.name}**! ได้รับ **${rewardCoins}** 💰 และ **${exp}** XP!`;

                if (exp >= level * 50) {
                    level++;
                    exp = 0;
                    maxHp += 15;
                    hp = maxHp;
                    resultMessage += `\n🆙 **เลเวลอัปเป็น Lv.${level}**!`;
                }

                if (selectedMonster.rareDrop && Math.random() < 0.15) {
                    if (!inventory[userId]) inventory[userId] = [];
                    inventory[userId].push(selectedMonster.rareDrop);
                    resultMessage += `\n🎁 คุณได้รับไอเทมหายาก: **${selectedMonster.rareDrop}**!`;
                }
                embedColor = '#28a745';
            } else {
                hp -= monsterAttack;
                hp = Math.max(hp, 0);
                resultMessage = hp === 0 ? `💀 คุณแพ้ **${selectedMonster.name}**!` : `💔 คุณแพ้ **${selectedMonster.name}**! HP เหลือ **${hp}/${maxHp}**`;
            }

            userStats[userId] = { hp, exp, level, maxHp, attackBonus };
            saveUserData();

            const fightResultEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`⚔️ ต่อสู้กับ ${selectedMonster.name}`)
                .setDescription(resultMessage)
                .addFields(
                    { name: '🛡️ มอนสเตอร์', value: selectedMonster.name, inline: true },
                    { name: '❤️ HP ของคุณ', value: `${hp}/${maxHp}`, inline: true },
                    { name: '💰 เหรียญ', value: `${userCoins}`, inline: true },
                    { name: '🆙 เลเวล', value: `Lv.${level} (${exp}/${level * 50} XP)`, inline: false }
                )
                .setFooter({ text: 'พยายามใหม่เพื่อฝึกฝนตัวเอง!' })
                .setTimestamp();

            await interaction.update({ embeds: [fightResultEmbed], components: [] });
        } catch (error) {
            await fightMessage.edit({ components: [] });
            message.reply('⏳ หมดเวลาสำหรับการเลือกมอนสเตอร์! ลองใหม่อีกครั้ง.');
        }
    },
};

loadUserData();
