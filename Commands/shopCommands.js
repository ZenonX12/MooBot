// shopCommands.js
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const items = require('../items');  // กลับขึ้นไปที่โฟลเดอร์หลัก

// ฟังก์ชันแสดงรายการสินค้าที่สามารถซื้อได้
function showShop(message) {
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

    const embed = new EmbedBuilder()
        .setColor('#28a745')
        .setTitle('🌟 ยินดีต้อนรับสู่ร้านค้า! 🌟')
        .setDescription('เลือกไอเทมที่คุณต้องการซื้อจากเมนูด้านล่าง:')
        .addFields(
            items.map(item => ({
                name: `**${item.name}** - ${item.price} เหรียญ`,
                value: `*${item.description}*`,
                inline: true
            }))
        )
        .setFooter({ text: 'ร้านค้าของเราเปิดตลอด 24 ชั่วโมง!' })
        .setTimestamp()
        .setImage('https://cdn.discordapp.com/attachments/1336344467178917908/1337042992564932754/a023595a6a0b3ade26fdf39f0b1ce703.gif'); // GIF

    message.channel.send({
        embeds: [embed],
        components: [row]
    });
}

// ฟังก์ชันจัดการการซื้อสินค้าของผู้ใช้
async function handlePurchase(interaction, userBalance) {
    const itemId = interaction.values[0];
    const item = items.find(i => i.id === itemId);
    const userCoins = userBalance[interaction.user.id] || 0;

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

    const filter = (response) => response.user.id === interaction.user.id && ['yes', 'no'].includes(response.content.toLowerCase());
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

    collector.on('collect', async (response) => {
        if (response.content.toLowerCase() === 'yes') {
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
}

module.exports = { showShop, handlePurchase };
