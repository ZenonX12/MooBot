require('dotenv').config();  // Load environment variables from .env
const { Client, GatewayIntentBits } = require('discord.js');  // Import necessary classes
const ZombieCommand = require('./commands/ZombieCommand');  // Import Zombie command
const axios = require('axios');
const chalk = require('chalk');

// Create Discord client with necessary intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// When the bot is online
client.once('ready', async () => {
  console.log(chalk.magenta('Bot is online and ready to fight zombies!'));
});

// Handling incoming messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;  // Prevent the bot from replying to itself

  const args = message.content.trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  // Check if the command is '!Zombie' and execute the command
  if (commandName === '!zombie') {
    try {
      await ZombieCommand.execute(message);
    } catch (error) {
      console.error(chalk.red('Error executing command:', error.message));
      message.reply('An error occurred while executing the command');
    }
  }
});

// Login to Discord with your app's token
client.login(process.env.DISCORD_TOKEN);
