'use strict'
// todo [] what does global do?
// todo [] what is _mckay_statistics_opt_out?

// https://github.com/DoctorMcKay/node-steamcommunity/issues/177
global._mckay_statistics_opt_out = true
// https://github.com/DoctorMcKay/node-stats-reporter#opting-out is no longer available
// not sure whether _mckay_statistics_opt_out is still applicable
// leaving it in for now, will look at it a later time

const Events = require('events')

const FileManager = require('./FileManager.js')
const ConfigManager = require('./ConfigManager.js')
const AccountsManager = require('./AccountsManager.js')

const {
  typeOfStr,
  objHasProperty,
  objHasProperties,
} = require('../../util/util.js')

/**
 * Creates a new BotManager instance.
 * @class
 */
class BotManager extends Events {
  constructor(props) {
    super()

    // declare and initialize bot accounts
    this.ActiveBotAccounts = []
    this.botsLoggingIn = []

    // setup new GUI instance
    this.GUI = new GUI(this)
   
    // fileManager
    this.fileManager = new FileManager('config')
    this.fileManager.on('debug', function debugFileManagerHandler(debugData) {
      this.logDebug(...debugData)
    })
    this.fileManager.on('info', function infoFileManagerHandler(infoData) {
      this.infoDebug(...infoData)
    })
    this.fileManager.on('error', function errorFileManagerHandler(error) {
      this.errorDebug(...error)
    })

    // configManager
    this.ConfigManager = new ConfigManager(this.fileManager)
    this.ConfigManager.on('debug', function debugConfigManagerHandler(debugData) {
      this.logDebug(...debugData)
    })
    this.ConfigManager.on('info', function infoConfigManagerHandler(infoData) {
        this.infoDebug(...infoData)
    })
    this.ConfigManager.on('error', function errorConfigManagerHandler(error) {
        this.errorDebug(...error)
    })
    this.ConfigManager.loadConfig(function loadConfigCallBack(err, config){
      if (err)
        this.errorDebug("Failed to load config")
      else {
        this.config = config
      }
    })

    // Accounts Manager
    this.AccountsManager = new AccountsManager(this.FileManager)
    this.AccountsManager.on('debug', function debugAccountsManagerHandler(debugData) {
      this.logDebug(debugData)
    })
    this.AccountsManager.on('info', function infoAccountsManagerHandler(infoData) {
      this.infoDebug(...infoData)
    })
    this.AccountsManager.on('error', function errorAccountsManagerHandler(error) {
      this.errorDebug(...error)
    })
  }
}

/**
 * 
 */
async function startManager(callback = async () => {}) {
  await this.startWebServer(true)

  await this.AccountsManager.getAccounts(async function getAccountsCallback(error, accounts){
    // for (const 
  })
}
BotManager.prototype.startManager = startManager

/**
 * 
 */
async function startWebServer(trySSL = false) {
  const requiredProperties = ['ssl', 'api_port']
  const { config = {} } = this

  if (objHasProperties(requiredProperties, config)) {
    const {api_port = null, ssl = null} = config

    if (api_port !== null && ssl !== null) {
      const serverOptions = null

      if (trySSL && objHasProperty('key', ssl)) {
        const {key = null, cert = null} = ssl
        
        if (key === null || cert === null) {
          this.errorDebug('key or cert is null... Disabling SSL')
        }

        let keyFile, certFile;
        // todo [] creating fileManager because I need to refactor code below...

        // this.fileManager.getFileUnparsed(key + '.key', null, function unparsedFileCallBack(err, file) {
        //   if (err) {
        //     this.errorDebug('Failed to access key file... Disabling SSL')
        //     // todo [] this recursive call isn't that good of an option
        //     // instead this function should be broken up so that it's more solid
        //     this.startWebServer(false)
        //     return
        //   }

        //   //
        //   const {} = ssl
        //   this.fileManager.getFileUnparsed(cert + '.cert', null, function unparsedCertFileCallback(err, certFile) {
        //     if (err) {
        //       this.errorDebug("Failed to access cert file... Disabling SSL");
        //       this.startWebserver(false);
        //       return; 
        //     }
        //   })
        // })
      } else {
        this.webserver = new this.webserver(this.logger, api_port, serverOptions)
        this.webserver.start(function startServerErrHandler(error) {
          if (error)
            this.errorDebug('Failed too start API webserver - ensure port not occupied')
          else
            this.emit('loadedAPI')
        })
      }
    }
  }
}
BotManager.prototype.startWebServer = startWebServer

module.exports = BotManager
