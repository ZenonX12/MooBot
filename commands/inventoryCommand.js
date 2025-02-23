// Variable to store player inventory data
let inventories = {};

// Function to add an item to the inventory
function addItemToInventory(userId, item) {
  if (!inventories[userId]) {
    inventories[userId] = []; // If there's no inventory for the user, create one
  }
  inventories[userId].push(item); // Add the item to the inventory
  console.log(`Received ${item.name} from ${userId}`);
}

// Function to get a user's inventory
function getInventory(userId) {
  return inventories[userId] || []; // If no inventory, return an empty array
}

// Function to display the items in the inventory
function showInventory(message) {
  const userId = message.author.id; // Get the user ID of the message sender
  const userInventory = getInventory(userId);
  
  if (!userInventory || userInventory.length === 0) {
    return message.reply("You have no items in your inventory!"); // If there are no items
  }
  
  // Create a message listing the items
  const itemsList = userInventory
    .map((item, index) => `${index + 1}. ${item.name} - ${item.description}`)
    .join('\n'); // Create a string with each item listed

  // Send the message displaying the item list
  message.reply(`You have the following items in your inventory:\n${itemsList}`);
}

// Export functions to be used externally
module.exports = {
  addItemToInventory,
  getInventory,
  showInventory,
};
