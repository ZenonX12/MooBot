const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const items = require('../items'); // กลับขึ้นไปที่โฟลเดอร์หลัก
const User = require('../models/User');  // การเรียกใช้โมเดลผู้ใช้จาก MongoDB

// ฟังก์ชันคำนวณราคาสินค้าหลังจากส่วนลด
function applyDiscount(item, quantity) {
    let discount = 0;
    if (quantity >= 3) {
        discount = 0.2;  // ลด 20% เมื่อซื้อ 3 ชิ้น
    }
    return item.price * (1 - discount);
}

// ฟังก์ชันแสดงรายการสินค้าที่สามารถซื้อได้
function showShop(message) {
    const categorySelectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_category')
        .setPlaceholder('เลือกหมวดหมู่สินค้า')
        .addOptions([
            { label: 'อาวุธ', value: 'weapons' },
            { label: 'อุปกรณ์เสริม', value: 'accessories' },
            { label: 'เครื่องประดับ', value: 'jewelry' },
        ]);

    const row = new ActionRowBuilder().addComponents(categorySelectMenu);

    const embed = new EmbedBuilder()
        .setColor('#28a745')
        .setTitle('🌟 ยินดีต้อนรับสู่ร้านค้า! 🌟')
        .setDescription('เลือกหมวดหมู่สินค้าที่คุณต้องการซื้อ:')
        .setFooter({ text: 'ร้านค้าของเราเปิดตลอด 24 ชั่วโมง!' })
        .setTimestamp()
        .setImage('https://cdn.discordapp.com/attachments/1336344467178917908/1337042992564932754/a023595a6a0b3ade26fdf39f0b1ce703.gif'); // GIF

    message.channel.send({
        embeds: [embed],
        components: [row]
    });
}

// ฟังก์ชันกรองสินค้าตามหมวดหมู่ที่เลือก
function filterItemsByCategory(category) {
    return items.filter(item => item.category === category);
}

// ฟังก์ชันจัดการการซื้อสินค้าของผู้ใช้
async function handlePurchase(interaction) {
    const itemId = interaction.values[0];  // เปลี่ยนจาก values[1] เป็น values[0]
    console.log("Item ID selected:", itemId);  // ตรวจสอบค่า itemId
    console.log("Available items:", items);   // ตรวจสอบรายการสินค้า    

    const item = items.find(i => i.id === itemId);  // หา item ที่ตรงกับ ID
    if (!item) {
        await interaction.reply({
            content: `❌ ไม่พบสินค้าในระบบ.`,
            ephemeral: true
        });
        return;
    }

    // ดึงยอดเงินจากฐานข้อมูล
    const user = await User.findOne({ userId: interaction.user.id });
    const userCoins = user ? user.balance : 0;

    // ถ้าเงินไม่พอ
    if (userCoins < item.price) {
        await interaction.reply({
            content: `❌ ขอโทษ, คุณไม่มีเหรียญเพียงพอในการซื้อ **${item.name}**. ลองทำภารกิจเพื่อหาเหรียญเพิ่มเติม!`,
            ephemeral: true  // ใช้ ephemeral แทน flags
        });
        return;
    }

    // เพิ่มตัวเลือกจำนวนสินค้าที่จะซื้อ
    const quantitySelectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_quantity')
        .setPlaceholder('เลือกจำนวนที่ต้องการซื้อ')
        .addOptions([
            { label: '1 ชิ้น', value: '1' },
            { label: '2 ชิ้น', value: '2' },
            { label: '3 ชิ้น', value: '3' },
            { label: '5 ชิ้น', value: '5' },
        ]);

    const row = new ActionRowBuilder().addComponents(quantitySelectMenu);

    const embed = new EmbedBuilder()
        .setColor('#28a745')
        .setTitle('🛍️ ยืนยันการซื้อสินค้า 🛍️')
        .setDescription(`คุณต้องการซื้อ **${item.name}** ราคา **${item.price}** เหรียญ หรือไม่?`)
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
        ephemeral: true  // ใช้ ephemeral แทน flags
    });

    const filter = (response) => response.user.id === interaction.user.id && ['yes', 'no'].includes(response.content.toLowerCase());
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

    collector.on('collect', async (response) => {
        if (response.content.toLowerCase() === 'yes') {
            // คำนวณราคาใหม่หลังจากส่วนลด
            const quantity = parseInt(interaction.values[1] || '1');
            const finalPrice = applyDiscount(item, quantity);

            // ลดเหรียญจากผู้ใช้
            user.balance -= finalPrice;
            await user.save();

            await response.reply(`🎉 คุณได้ซื้อ **${item.name}** ${quantity} ชิ้น ในราคา ${finalPrice} เหรียญ! คุณมีเหรียญเหลือ ${user.balance} เหรียญ.`);
        } else if (response.content.toLowerCase() === 'no') {
            await response.reply(`🚫 การซื้อ **${item.name}** ถูกยกเลิก.`);
        }
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.followUp({ content: 'หมดเวลาในการตอบกลับ', ephemeral: true });
        }
    });
}

// ฟังก์ชันให้รีวิวสินค้า
async function handleReview(interaction, item) {
    const userReview = item.reviews.find(review => review.user === interaction.user.id);
    if (userReview) {
        await interaction.reply({ content: 'คุณได้รีวิวสินค้านี้ไปแล้ว!', ephemeral: true });
        return;
    }

    const reviewEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`📢 รีวิวสินค้า: **${item.name}**`)
        .setDescription('กรุณาให้คะแนนสินค้า (1-5):');

    await interaction.reply({ embeds: [reviewEmbed], ephemeral: true });

    const filter = (response) => response.user.id === interaction.user.id && ['1', '2', '3', '4', '5'].includes(response.content);
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

    collector.on('collect', async (response) => {
        const rating = parseInt(response.content);
        // บันทึกรีวิว
        item.reviews.push({ user: interaction.user.id, rating });

        await response.reply(`🌟 ขอบคุณสำหรับการให้คะแนน **${item.name}**! คะแนนของคุณคือ ${rating} คะแนน.`);
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.followUp({ content: 'หมดเวลาในการตอบกลับ', ephemeral: true });
        }
    });
}

// ฟังก์ชันส่งของขวัญ
async function sendGift(interaction, recipientId, item) {
    const user = await User.findOne({ userId: interaction.user.id });
    if (user.balance < item.price) {
        await interaction.reply('คุณไม่มีเหรียญเพียงพอสำหรับการซื้อของขวัญ');
        return;
    }

    // ลดเหรียญของผู้ให้
    user.balance -= item.price;
    await user.save();
    
    // ส่งของขวัญ
    await interaction.reply(`🎁 คุณได้ส่ง **${item.name}** ให้ <@${recipientId}> เป็นของขวัญแล้ว!`);
}

module.exports = { showShop, handlePurchase, handleReview, sendGift };
