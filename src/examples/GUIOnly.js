/**
 * This is a simple example of a bot that will simply run the tool to use the GUI aspect of the bot.
 * This will not do any handling of events automatically.
 *
 * Make sure you copy this file and not use it directly. Follow install instructions on github.
 */

/* We will require the node-steam-bot-manager module to use it */
const BotManager = require('node-steam-bot-manager');
const botsManager = new BotManager();// Create new instance of the BotManager

async function startManagerErrorCallback(error) {
    if (error) {
        console.error(error)
        botsManager.errorDebug('Failed to Start the Bot Manager.')
    }
}

async function GUIOnly() {
    // Start the manager
    await botsManager.startManager(startManagerErrorCallback)
}

GUIOnly() // Run the code above.
