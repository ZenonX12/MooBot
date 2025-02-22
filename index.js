require('dotenv').config();
const { Client, GatewayIntentBits, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
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
        const row = new ActionRowBuilder()
            .addComponents(
                items.map(item => new ButtonBuilder()
                    .setCustomId(item.id)
                    .setLabel(`${item.name} - ${item.price} เหรียญ`)
                    .setStyle(ButtonStyle.Primary)
                )
            );

        // สร้าง Embed เพื่อแสดงร้านค้าให้สวยงาม
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('ยินดีต้อนรับสู่ร้านค้า!')
            .setDescription('เลือกไอเทมที่คุณต้องการซื้อ:')
            .setThumbnail('https://example.com/shop_thumbnail.png') // เพิ่มภาพธัมเบิลนอล
            .addFields(
                items.map(item => ({
                    name: `${item.name}`,
                    value: `${item.description}\nราคา: ${item.price} เหรียญ`
                }))
            )
            .setFooter({ text: 'ร้านค้าของเราเปิดตลอด 24 ชั่วโมง!' })
            .setTimestamp();

        message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }

    // คำสั่งดูจำนวนเงินในบัญชีของผู้ใช้
    if (message.content === '!balance') {
        const balance = userBalance[message.author.id] || 0;
        message.channel.send(`${message.author.username} คุณมี ${balance} เหรียญ`);
    }
});

// คำสั่งซื้อสินค้าเมื่อผู้ใช้คลิกปุ่ม
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const itemId = interaction.customId;
    const item = items.find(i => i.id === itemId);
    const userCoins = userBalance[interaction.user.id] || 0;

    if (userCoins >= item.price) {
        // ซื้อสำเร็จ
        userBalance[interaction.user.id] = userCoins - item.price;
        await interaction.reply({
            content: `🎉 คุณได้ซื้อ ${item.name} ในราคา ${item.price} เหรียญ! คุณมีเหรียญเหลือ ${userBalance[interaction.user.id]} เหรียญ.`,
            ephemeral: true
        });
    } else {
        // เงินไม่พอ
        await interaction.reply({
            content: `❌ ขอโทษ, คุณไม่มีเหรียญเพียงพอในการซื้อ ${item.name}.`,
            ephemeral: true
        });
    }
});

client.login(process.env.BOT_TOKEN);
