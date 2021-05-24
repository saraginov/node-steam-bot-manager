'use strict'

const Events = require('events')

class AccountsManager extends Events {
  constructor(fileManager = null) {
    super()

    // todo [] want to implement error handling, i.e. if fileManager not 
    // passed correctly or something similar
    // if (fileManager !== null)
    
    // todo [] both AccountsManager and BotManager have a fileManager 
    // property and related object value... only 1 should be needed
    // or FileManager should be moved to utility functions...

    this.fileManager = fileManager
    this.accounts = []
    this.defaultAccount = {}
    
    const path = 'data'
    async function errorCallback(error) {
      if (error)
        this.emit('error', 'Failed to create \'data\' folder under \'config\'.')
      else
        this.emit('debug', 'Created \'data\' folder if it doesn\'t exist.')
    }

    await this.fileManager.createFolderIfNotExist(path, errorCallback)
  }
}

/**
 * 
 */
async function getAccounts(callback = async (err, accounts) => {err, accounts}) {
  const { accounts = [] } = this

  if (accounts.length === 0) { 
    async function loadAccountsCallBack(error, newAccounts) {
      if (error) {
        // todo []
      }
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
      accounts.splice(0, 0, newAccounts)
    }

    try {
      await this.loadAccounts(loadAccountsCallBack)
    } catch (error) {
      // todo []
    }
  }
  
  callback(error, this.accounts)
}
AccountsManager.prototype.getAccounts = getAccounts

/**
 * 
 */
async function loadAccounts(callback = async (err, accounts) => {err, accounts}) {
  
}

module.exports = AccountsManager
