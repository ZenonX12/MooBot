require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const chalk = require('chalk');

// Importing commands
const ZombieCommand = require('./commands/ZombieCommand');
const InventoryCommand = require('./commands/inventoryCommand');

// Webhook utility function
const sendToDiscordWebhook = async (title, message, color = '#FF0000') => {
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setTimestamp();

    await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(chalk.red(`❌ Webhook Error: ${error.message}`));
  }
};

// Initialize Discord bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Handle bot startup
client.once('ready', async () => {
  console.log(chalk.green('✅ Bot is online and ready to go!'));
  await sendToDiscordWebhook('✅ Bot Online', '```The bot is running and ready!```', '#00FF00');
});

// Handle incoming messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  // Command: !zombie
  if (commandName === '!zombie') {
    try {
      await ZombieCommand.execute(message);
    } catch (error) {
      console.error(chalk.red(`❌ Error executing !zombie: ${error.message}`));
      message.reply('An error occurred while executing the command.');
      await sendToDiscordWebhook('❌ Error executing !zombie', error.message);
    }
  }

  // Command: !inventory
  if (commandName === '!inventory') {
    try {
      await InventoryCommand.showInventory(message); // Call showInventory from InventoryCommand
    } catch (error) {
      console.error(chalk.red(`❌ Error executing !inventory: ${error.message}`));
      message.reply('An error occurred while executing the command.');
      await sendToDiscordWebhook('❌ Error executing !inventory', error.message);
    }
  }
});

// Handle bot disconnection
client.on('shardDisconnect', async (event, id) => {
  console.warn(chalk.yellow(`⚠️ Disconnected (Shard ID: ${id})`));
  await sendToDiscordWebhook('⚠️ Bot Offline', `The bot disconnected (Shard ID: ${id})`, '#FFA500');
});

// Handle bot shutdown
const shutdownHandler = async (reason) => {
  console.warn(chalk.yellow(`⚠️ Shutting down: ${reason}`));
  
  await Promise.allSettled([ 
    sendToDiscordWebhook('⚠️ Bot Offline', `Shutting down: ${reason}`, '#FFA500')
  ]);

  process.exit(0);
};

// Listen for shutdown signals
['beforeExit', 'SIGINT', 'SIGTERM'].forEach(event =>
  process.on(event, () => shutdownHandler(`Received ${event}`))
);

// Bot login
client.login(process.env.DISCORD_TOKEN).catch(async (error) => {
  console.error(chalk.red(`❌ Login Error: ${error.message}`));
  await sendToDiscordWebhook('❌ Error logging in', error.message);
  process.exit(1);
});
