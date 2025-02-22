require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const items = require('./items');  // Assuming items.js is in the same directory
const { showShop, handlePurchase } = require('./Commands/shopCommands.js');
const fightCommand = require('./Commands/fightCommands');  // ใช้เพียง fightCommands
const config = require('./config');
const fs = require('fs');

// Path to the user balances file
const userBalancesFile = './userBalances.json';

// Initialize the bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Store user balances, will load from file on bot startup
let userBalances = {};

// Function to load user balances from file
function loadUserBalances() {
    if (fs.existsSync(userBalancesFile)) {
        try {
            const data = fs.readFileSync(userBalancesFile);
            userBalances = JSON.parse(data);
        } catch (error) {
            console.error('Error loading user balances:', error);
        }
    }
}

// Function to save user balances to file
function saveUserBalances() {
    try {
        fs.writeFileSync(userBalancesFile, JSON.stringify(userBalances, null, 2));
    } catch (error) {
        console.error('Error saving user balances:', error);
    }
}

// Event: Bot is ready
client.once('ready', () => {
    console.log('Bot is online!');
    loadUserBalances();  // Load balances when the bot starts
});

// Command to show the shop and fight commands separately
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Prevent bot from responding to its own messages

    // Check for !shop command first
    if (message.content === '!shop') {
        showShop(message);
        return;  // Ensure that the rest of the code doesn't execute after handling the shop command
    }

    // Check for !fight command
    if (message.content === '!fight') {
        const userId = message.author.id;
        const userBalance = userBalances[userId] || 0;  // Get the user's balance
        fightCommand.execute(message, userBalance)  // Pass userBalance correctly
            .then((updatedBalance) => {
                // Save updated balance if necessary
                if (updatedBalance !== userBalance) {
                    userBalances[userId] = updatedBalance;
                    saveUserBalances();
                }
            })
            .catch((error) => {
                console.error('Error during fight:', error);
            });
    }
});

// Command to handle interactions (purchase items)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    try {
        await handlePurchase(interaction, userBalances);

        // After handling purchase, update the balance
        const userId = interaction.user.id;
        const newBalance = userBalances[userId] || 0;
        userBalances[userId] = newBalance;  // Ensure that the balance is updated after purchase
        saveUserBalances();  // Save balances after any transaction
    } catch (error) {
        console.error('Error handling purchase:', error);
        await interaction.reply({
            content: '❌ Something went wrong with the purchase. Please try again later.',
            ephemeral: true
        });
    }
});

// Save balances before the bot shuts down
process.on('SIGINT', () => {
    saveUserBalances();
    process.exit();
});

// Bot login
client.login(config.BOT_TOKEN).catch(error => {
    console.error('Failed to log in:', error);
});
