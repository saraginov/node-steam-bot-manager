'use strict'

const Events = require('events')

//
const inquirer = require('inquirer')
const EResult = require('../enums/EResult.js')

// questions Array of Objects
const registerQuestions = require('./registerAccountQuestions.js')
const importQuestions = require('./importAccountQuestions.js')

/**
 * Creates a new GUI_Handler instance.
 * @class
 * @param main - BotManager class from ./index.js
 */
class GUI extends Events {
  prototype(main = {}) {
    super()
    this.main = main

    // todo [] - logger, currently not implemented
    // this.logger = main.logger
  }
}

/**
 * 
 */
async function displayBotMenu() {
  const choices = []
  const accounts = await this.main.getAccounts() || []

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    const accountName = account.getAccountName()
    const displayName = '[{0}]'.format(accounts[i].getDisplayName())
    const botData = accountName + displayName
    choices.push(botData)
  }

  // add enquirer
  choices.push(new inquirer.Separator())
  // add register and exit options
  choices.push('register')
  choices.push('exit')

  const botList = [
    {
      type: 'list',
      name: 'username',
      message: 'Choose the bot you would like to operate:',
      choices: choices
    }
  ]

  // prompt user
  inquirer.prompt(botList)
  .then( res => {
    const { username = '' } = res

    switch (username) {
      case 'register': {
        // todo [] optionsList below should belong to its own file and be imported
        // todo [] change inquirer.prompt(options).then()
          // to const userInput = await inquirer.prompt(options)
        // todo [] wrap await call above in try catch block
        const choices = []
        choices.push('Create new Steam account')
        choices.push(new inquirer.Separator())
        choices.push('Import account')
        
        const optionsList = [
          {
            type: 'list',
            name: 'registerOption',
            message: 'Choose how you would like to register?:',
            choices: choices
          }
        ]

        inquirer.prompt(optionsList)
        .then( res => {
          const {registerOption = ''} = res
          
          switch (registerOption) {
            case 'Create new Steam account':
              inquirer.prompt(registerQuestions)
              .then( res => {
                const {username = '', password = '', email = ''} = res
                const criteriaMet = username.length > 0 && password.length > 0 && email.length > 0
                
                if (!criteriaMet) {
                  await this.main.errorDebug('Either username, password or email are empty')
                  await this.displayBotMenu()
                } else {
                  await this.main.randomBot({}).createAccount(username, password, email, (responseCode, steamId) => {
                      const { OK } = EResult

                      if (responseCode !== OK) {
                        const errMsg = EResult[responseCode]

                        await this.main.errorDebug('Failed to create account due to:' + errMsg)
                        await this.main.displayBotMenu()
                      } else {
                        await this.main.registerAccount(username, password, [], err => {
                          if (err) {
                            let errMsg = 'Invalid username/password, either'
                            errMsg = errMsg.concat(' edit data file or attempt')
                            errMsg = errMsg.concat(' registering again...')
                          
                            await this.main.errorDebug(errMsg)
                          } else {
                            await this.main.infoDebug('Successfully added new account')
                            await this.displayBotMenu()
                          }
                        })
                      }
                    }) 
                }
              })
              break;

            case 'Import account':
              inquirer.prompt(importQuestions)
              .then(res => {
                const {
                  username = '', password = '', shared_secret = '',
                  identity_secret = '', revocation = ''
                } = res
                const criteriaMet = username.length > 0 && password.length > 0
                
                if (!criteriaMet) {
                  await this.main.errorDebug('Username and password are required, but one or both are empty')
                  await this.displayBotMenu()
                } else {
                  const accountDetails = {}
                  if (shared_secret.length > 0) accountDetails['shared_secret'] = shared_secret
                  if (identity_secret.length > 0) accountDetails['identity_secret'] = identity_secret
                  if (revocation.length > 0) accountDetails['revocation'] = revocation

                  await this.main.registerAccount(username, password, details, err => {
                    if (err) this.main.errorDebug('Username and/or password are incorrect')
                    this.displayBotMenu()
                  })
                }
              })
              break;
          }
        })
        break;
      }    
      
      case 'exit':
         process.exit()
    
      default: {
        const bot = username.split('\[')[0]
        await this.main.findBot(bot, (error = null, accountDetails = {}) => {
          if(error) this.main.errorDebug(error)
          else this.displayMenu(accountDetails)
        })
        break;
      }        
    }
  })
}
GUI_Handler.prototype.displayBotMenu = displayBotMenu

/**
 * 
 */
async function displayMenu(botAccount = null) {
  // todo [] if botAccount is null, need to throw error
}
GUI_Handler.prototype.displayMenu = displayMenu

/**
 * 
 */
async function initTradeMenu(botAccount = null) {
  // todo [] if botAccount is null, need to throw error

}
GUI_Handler.prototype.initTradeMenu = initTradeMenu

/**
 * 
 */
async function tradeMenu(botAccount = null, tradeMenuOption = null) {
  // todo [] if botAccount || tradeMenuOptions are null, need to throw error
  botAccount.Friends.getFriends( (err = null, friendsList = []) => {
    if (err) {
      await this.main.errorDebug(err.toString())
      await this.displayMenu(botAccount)
    } else {
      const friendsUsernames = []
      for (let i = 0; i < friendsList.length; i++) {
        const {username = ''} = friendsList[i]
        friendsUsernames.push(username)
      }  
      friendsList.unshift({username: 'Back'}) // add Back to first position

      const tradeMenu = [
        {
          type: 'list',
          name: 'tradeOption',
          message: 'Who would you like to trade with?',
          choices: friendsUsernames
        }
      ]

      try {
        const userInput = await inquirer.prompt(tradeMenu)
        const { tradeOption = 0 } = userInput
        const friendIndex = friendsUsernames.indexOf(tradeOption)

        switch (friendIndex) {
          case 0: // go back
              await this.initTradeMenu(botAccount)
            break;
        
          default: {
              // open chat with partner and create trade with said partner
              const partner = friendsList[friendIndex]
              const {accountSid = ''} = partner
              await botAccount.Trade.createOffer(accountSid, (err, currentOffer) => {
                if (err) {
                  await this.main.errorDebug('Failed to create trade offer due to ' + err)
                  return await this.displayMenu(botAccount)
                }

                switch (tradeMenuOption) {
                  case 0: {
                    const appId = await this.main.getAppId()
                    // todo [] what do 2 and true stand for?!
                    await botAccount.getUserInventory(accountSid, appId, 2, true, (err, inv, curr) => {
                      // inv stands for inventory, curr stands for currencies
                      if (err) {
                        // !important todo [] this is where i left of

                      } else {

                      }
                    })
                    break;
                  }
                    

                  case 1:
                    
                    break;
                
                  default:
                    // not sure about this loopy error handling...
                    await this.tradeMenu(botAccount, tradeMenuOption)
                    break;
                }
              })
            }
            break;
        }
      } catch (error) {
        // todo [] find best way to handle error
        await this.main.errorDebug(error)
        throw error
      }
    }
  })
}
GUI_Handler.prototype.displayBotMenu = tradeMenu

/**
 * 
 */
async function processChat(botAccount = null, target = null) {
  // todo [] improve error handling below
  if (botAccount === null || target === null) return
  
  // todo [] - move chatMessage to external file
  const chatMessage = [
    {
      message: 'Enter your message (\'quit\' to leave):',
      type: 'input',
      name: 'message'
    }
  ]

  try {
    const userInput = await inquirer.prompt(chatMessage) 
    const {message = ''} = userInput
    const lowerCasedMsg = message.toLowerCase()

    if (lowerCasedMsg === 'quit' || lowerCasedMsg === 'exit') {
      // todo [] what does null for setChatting mean?
      await botAccount.setChatting(null)
      await this.displayMenu(botAccount)
    } else {
      await botAccount.Friends.sendMessage(target, message, (err) => {
        if (err) {
          await this.main.errorDebug('Error occurred when sending message')
        }
        await this.processChat(botAccount, target)
      })
    }
  } catch (error) {
    await this.main.errorDebug('Error occurred when sending message')
    throw error
  }
}
GUI_Handler.prototype.processChat = processChat

module.exports = GUI;
