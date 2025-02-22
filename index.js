require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// รายการสินค้าที่สามารถซื้อได้
const items = [
    { name: 'น้ำยาฟื้นฟู', price: 50, id: 'potion', description: 'ใช้ฟื้นฟูพลังชีวิต', image: 'https://example.com/potion.png' },
    { name: 'ดาบ', price: 100, id: 'sword', description: 'ดาบที่ใช้ในการโจมตี', image: 'https://example.com/sword.png' },
    { name: 'โล่', price: 150, id: 'shield', description: 'ใช้ป้องกันการโจมตี', image: 'https://example.com/shield.png' }
];

// เก็บข้อมูลเงินของผู้ใช้
const userBalance = {};

// เมื่อบอทเริ่มทำงาน
client.once('ready', () => {
    console.log('บอทออนไลน์แล้ว!');
});

// คำสั่งดูรายการสินค้าที่สามารถซื้อได้
client.on('messageCreate', (message) => {
    if (message.content === '!shop') {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_item')
            .setPlaceholder('เลือกไอเทมที่คุณต้องการซื้อ')
            .addOptions(
                items.map(item => ({
                    label: `${item.name} - ${item.price} เหรียญ`,
                    value: item.id,
                    description: item.description,
                    emoji: '🛒',
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // สร้าง Embed เพื่อแสดงร้านค้าให้สวยงาม
        const embed = new EmbedBuilder()
            .setColor('#28a745')  // ใช้สีเขียวโมเดิร์น
            .setTitle('🌟 ยินดีต้อนรับสู่ร้านค้า! 🌟')
            .setDescription('เลือกไอเทมที่คุณต้องการซื้อจากเมนูด้านล่าง:')
            .addFields(
                items.map(item => ({
                    name: `**${item.name}** - ${item.price} เหรียญ`,
                    value: `*${item.description}*`, // ให้รายละเอียด
                    inline: true
                }))
            )
            .setFooter({ text: 'ร้านค้าของเราเปิดตลอด 24 ชั่วโมง!' })
            .setTimestamp()
            .setImage('https://cdn.discordapp.com/attachments/1336344467178917908/1337042992564932754/a023595a6a0b3ade26fdf39f0b1ce703.gif');  // เพิ่ม GIF ใน Embed

        message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

// คำสั่งซื้อสินค้าเมื่อผู้ใช้เลือกจากเมนู
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    const itemId = interaction.values[0];
    const item = items.find(i => i.id === itemId);
    const userCoins = userBalance[interaction.user.id] || 0;

    // แสดงยอดเงินของผู้ใช้ก่อนการซื้อ
    const embed = new EmbedBuilder()
        .setColor('#28a745')
        .setTitle('🛍️ ยืนยันการซื้อสินค้า 🛍️')
        .setDescription(`คุณต้องการซื้อ **${item.name}** ราคา **${item.price}** เหรียญหรือไม่?`)
        .addFields(
            { name: 'ยอดเงินของคุณ', value: `${userCoins} เหรียญ`, inline: true },
            { name: 'ยอดเงินที่เหลือ', value: `${userCoins - item.price} เหรียญ`, inline: true }
        )
        .setFooter({ text: 'ตอบกลับเพื่อยืนยันการซื้อ' })
        .setTimestamp()
        .setImage(item.image);

    await interaction.reply({
        content: 'กรุณายืนยันการซื้อสินค้าด้านล่าง',
        embeds: [embed],
        ephemeral: true
    });

    // รอการตอบรับยืนยันการซื้อจากผู้ใช้
    const filter = (response) => response.user.id === interaction.user.id && ['yes', 'no'].includes(response.content.toLowerCase());
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

    collector.on('collect', async (response) => {
        if (response.content.toLowerCase() === 'yes') {
            // ซื้อสำเร็จ
            if (userCoins >= item.price) {
                userBalance[interaction.user.id] = userCoins - item.price;
                await response.reply(`🎉 คุณได้ซื้อ **${item.name}** ในราคา ${item.price} เหรียญ! คุณมีเหรียญเหลือ ${userBalance[interaction.user.id]} เหรียญ.`);
            } else {
                await response.reply(`❌ ขอโทษ, คุณไม่มีเหรียญเพียงพอในการซื้อ **${item.name}**.`);
            }
        } else if (response.content.toLowerCase() === 'no') {
            await response.reply(`🚫 การซื้อ **${item.name}** ถูกยกเลิก.`);
        }
        collector.stop();
    });
});

client.login(process.env.BOT_TOKEN);
