const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const chalk = require('chalk');

// Webhook logging function
const sendToDiscordWebhook = async (title, message, color = '#FF0000', user = null) => {
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setTimestamp()
      .addFields(
        { name: 'User', value: user ? user.username : 'Unknown' },
        { name: 'Time', value: new Date().toISOString() }
      );

    await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(chalk.red(`❌ Webhook Error: ${error.message}`));
  }
};

// Cooldown map to prevent spamming
const cooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5 seconds cooldown

module.exports = {
  data: {
    name: '!help',
    description: 'แสดงคำสั่งทั้งหมดที่คุณสามารถใช้'
  },

  async execute(message) {
    try {
      // Check cooldown
      if (cooldowns.has(message.author.id)) {
        return message.reply('โปรดรอคอยก่อนที่จะใช้คำสั่งนี้อีกครั้ง!');
      }

      cooldowns.set(message.author.id, Date.now());

      setTimeout(() => {
        cooldowns.delete(message.author.id);
      }, COOLDOWN_TIME);

      // สร้าง Embed สำหรับคำสั่งทั้งหมดในภาษาไทย
      const embedTH = new EmbedBuilder()
        .setTitle('🆘 คำสั่งทั้งหมด')
        .setDescription('✨ เริ่มต้นการผจญภัยและสนุกไปกับการต่อสู้! ต่อไปนี้คือคำสั่งที่คุณสามารถใช้ในเกมของเรา:')
        .setColor('#2D9CDB')
        .addFields(
          { name: '💀 **!zombie**', value: 'เริ่มต้นการผจญภัยใหม่ในเกม\nตัวอย่าง: `!zombie` เพื่อเริ่มการต่อสู้' },
          { name: '🎒 **!inventory**', value: 'ดูของที่คุณมีในสต็อก\nตัวอย่าง: `!inventory` เพื่อดูรายการไอเทมทั้งหมดของคุณ' },
          { name: '🆘 **!help**', value: 'แสดงคำสั่งทั้งหมดที่คุณสามารถใช้\nตัวอย่าง: `!help` เพื่อดูคำสั่งทั้งหมด' },
          { name: '📘 Support', value: '[คลิกที่นี่สำหรับการช่วยเหลือและเอกสาร](https://your-support-link.com)' }
        )
        .setFooter({ text: `เวอร์ชัน: 1.0.0 | หากคุณต้องการความช่วยเหลือเพิ่มเติม ติดต่อผู้ดูแลเกม!` })
        .setTimestamp()
        .setThumbnail('https://example.com/your_image.png')
        .setImage('https://example.com/your_banner.png');

      // สร้าง Embed สำหรับคำสั่งทั้งหมดในภาษาอังกฤษ
      const embedEN = new EmbedBuilder()
        .setTitle('🆘 All Commands')
        .setDescription('✨ Start your adventure and fight your way through! Here are the commands you can use in our game:')
        .setColor('#2D9CDB')
        .addFields(
          { name: '💀 **!zombie**', value: 'Start a new adventure in the game\nExample: `!zombie` to start the fight' },
          { name: '🎒 **!inventory**', value: 'View the items in your inventory\nExample: `!inventory` to see all your items' },
          { name: '🆘 **!help**', value: 'Shows all the available commands\nExample: `!help` to see all commands' },
          { name: '📘 Support', value: '[Click here for help and documentation](https://your-support-link.com)' }
        )
        .setFooter({ text: `Version: 1.0.0 | If you need more help, contact the game admin!` })
        .setTimestamp()
        .setThumbnail('https://example.com/your_image.png')
        .setImage('https://example.com/your_banner.png');

      // สร้างปุ่มสำหรับเลือกภาษา
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('language_th')
          .setLabel('ภาษาไทย')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('language_en')
          .setLabel('English')
          .setStyle(ButtonStyle.Primary)
      );

      // ส่ง Embed และปุ่มไปยัง Discord
      await message.channel.send({ embeds: [embedTH], components: [row] });

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      await sendToDiscordWebhook('❌ Error executing !help', error.message, '#FF0000', message.author);
      message.reply('เกิดข้อผิดพลาดในการเรียกใช้คำสั่งนี้! โปรดลองใหม่ในภายหลัง หรือแจ้งผู้ดูแลเกมหากปัญหายังคงอยู่');
    }
  },

  async buttonInteraction(interaction) {
    if (!interaction.isButton()) return;

    try {
      // Handle language selection
      if (interaction.customId === 'language_th') {
        const embedTH = new EmbedBuilder()
          .setTitle('🆘 คำสั่งทั้งหมด')
          .setDescription('✨ เริ่มต้นการผจญภัยและสนุกไปกับการต่อสู้! ต่อไปนี้คือคำสั่งที่คุณสามารถใช้ในเกมของเรา:')
          .setColor('#2D9CDB')
          .addFields(
            { name: '💀 **!zombie**', value: 'เริ่มต้นการผจญภัยใหม่ในเกม\nตัวอย่าง: `!zombie` เพื่อเริ่มการต่อสู้' },
            { name: '🎒 **!inventory**', value: 'ดูของที่คุณมีในสต็อก\nตัวอย่าง: `!inventory` เพื่อดูรายการไอเทมทั้งหมดของคุณ' },
            { name: '🆘 **!help**', value: 'แสดงคำสั่งทั้งหมดที่คุณสามารถใช้\nตัวอย่าง: `!help` เพื่อดูคำสั่งทั้งหมด' },
            { name: '📘 Support', value: '[คลิกที่นี่สำหรับการช่วยเหลือและเอกสาร](https://your-support-link.com)' }
          )
          .setFooter({ text: `เวอร์ชัน: 1.0.0 | หากคุณต้องการความช่วยเหลือเพิ่มเติม ติดต่อผู้ดูแลเกม!` })
          .setTimestamp();
        
        await interaction.update({ embeds: [embedTH], components: [] }); // Update Embed based on language choice
      } else if (interaction.customId === 'language_en') {
        const embedEN = new EmbedBuilder()
          .setTitle('🆘 All Commands')
          .setDescription('✨ Start your adventure and fight your way through! Here are the commands you can use in our game:')
          .setColor('#2D9CDB')
          .addFields(
            { name: '💀 **!zombie**', value: 'Start a new adventure in the game\nExample: `!zombie` to start the fight' },
            { name: '🎒 **!inventory**', value: 'View the items in your inventory\nExample: `!inventory` to see all your items' },
            { name: '🆘 **!help**', value: 'Shows all the available commands\nExample: `!help` to see all commands' },
            { name: '📘 Support', value: '[Click here for help and documentation](https://your-support-link.com)' }
          )
          .setFooter({ text: `Version: 1.0.0 | If you need more help, contact the game admin!` })
          .setTimestamp();
        
        await interaction.update({ embeds: [embedEN], components: [] }); // Update Embed based on language choice
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error handling button interaction: ${error.message}`));
      await sendToDiscordWebhook('❌ Error handling button interaction', error.message, '#FF0000', interaction.user);
    }
  },
};
