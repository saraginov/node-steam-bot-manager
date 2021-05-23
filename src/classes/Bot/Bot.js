'use strict'

const Events = require('events')
const request = require('request')
const SteamCommunity = require('steamcommunity')
const SteamUser = require('steam-user')
const SteamStore = require('steamstore')
const TradeOfferManager = require('steam-tradeoffer-manager')

const {
  typeOfStr,
  objHasProperty,
  objHasProperties,
} = require('../../util/util.js')

const { defaultBotSettings } = require('./defaultBotSettings.js')

const Auth = require('../Auth/Auth.js')
const Profile = require('../Profile/Profile.js')

/**
 * @class Create a new Bot instance - extends EventEmitter
 * @param username - string
 * @param password - string // todo - is this safe?
 * @param details - object
 * @param settings - object
 */
class Bot extends Events {
  constructor (userName = null, password = null, details = null, settings = null) {
    // because Bot extends Events, without super() we get
    // ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super
    super()

    this.userName = typeOfStr(userName) ? userName : undefined
    this.password = typeOfStr(password) ? password : undefined

    // todo - not sure if this should be here?
    const reqDetails = ['steamguard', 'oAuthToken']
    if (this.userName === undefined || this.password === undefined)
      if (details === null || !objHasProperties(reqDetails, details))
        throw new Error('Invalid username/password or missing oAuthToken/Steamguard code')

    this.details = details
    this.settings = settings || defaultBotSettings

    // setDisplayName and apiKey if details object has said props
    if (details !== null && objHasProperty('displayName', details)) 
      this.displayName = details.displayName || undefined
    if (details !== null && objHasProperty('apiKey', details)) 
      this.apiKey = details.apiKey || undefined

    // Bot properties
    this.freshLogin = true

    // todo [] rewrite Auth...
    this.Auth = new Auth(details)
    this.Auth.setSettings(settings)
  }
}

/**
 * 
 */
Bot.prototype.printSelf = function printSelf() {
  console.log({...this})
}

/**
 * Initiate the user with custom options incase you wish to use a proxy/bind requests to localAddress. Or provide custom options to certain users.
 * @param options (NOT optional), if options are not available when calling initUser pass empty Object {}
 * @param callback (optional)
 */
// todo [] all of the event listeners in Bot.initUser are activated on error, 
// i.e. an error event triggers all listeners, should events not be unique?
// for example, error for friends is errorFriends, etc.
Bot.prototype.initUser = function botInitUser(options = {}, callback = () => {}) {
  const allOpts = {}
  // todo not sure what request.defaults does
  if(objHasProperty('request', options))
    allOpts.request = request.defaults(options.request)

  this.community = new SteamCommunity(allOpts)

  this.TradeOfferManager = new TradeOfferManager({
    steam: this.client,
    community: this.community,
    // Keep offers upto 1 day, and then just cancel them.
    cancelTime: objHasProperty('cancelTime', options) ? options.cancelTime :
      this.settings.tradeCancelTime,
    // Keep offers upto 30 mins, and then cancel them if they still need confirmation
    pendingCancelTime: objHasProperty('pendingCancelTime', options) ? 
      options.pendingCancelTime : this.settings.tradePendingCancelTime,
    // Cancel offers once we hit 7 day threshold
    cancelOfferCount: objHasProperty('cancelOfferCount', options) ? 
      options.cancelOfferCount : this.settings.tradeCancelOfferCount,
    // Keep offers until 7 days old
    cancelOfferCountMinAge: objHasProperty('cancelOfferCountMinAge', options) ? 
      options.cancelOfferCountMinAge : this.settings.tradeCancelOfferCount,
    // We want English item descriptions
    language: objHasProperty('language', options) ? options.language :
      self.settings.language,
    // We want to poll every 5 seconds since we don't have Steam notifying us of offers
    pollInterval: objHasProperty('tradePollInterval', options) ?
      options.tradePollInterval : self.settings.tradePollInterval
  })

  // todo [] if this.community.request can be accessed why are you duplicating it?!
  // I think code below is wrong! and can be removed
  // this.request = this.community.request

  // todo [] what is SteamStore?
  this.store = new SteamStore()

  // todo [] why is initAuth called and logged in is set to false?
  this.Auth.initAuth(this.community, this.store, this.client)
  this.loggedIn = false

  // todo [] ??? why do we have this.Request and this.request?!
  this.Request = new Request(this.community.request)
  // this.Request event listeners and emitters ---------------------------------
  this.Request.on('error', function botRequestErrorHandler(error) {
    this.emit('error', ...error)
  })
  self.Request.on('debug', function botRequestDebugHandler(debugData) {
    self.emit('debug', ...debugData)
  })
  
  // client refers to SteamUser as a client, i.e. Steam is service, we are client
  this.client = new SteamUser({promptSteamGuardCode: false})
  // this.client event listeners and emitters ---------------------------------
  this.client.on('loggedOn', function clientLoggedOnHandler(details, parental) {
    this.emit('loggedInNodeSteam', details)
    this.emit('debug', 'Logged into Steam via SteamClient on %s.', this.getAccountName())
    // todo what does 1 stand for ?
    this.client.setPersona(1)
  })
  this.client.on('steamGuard', function(domain = '', callback = () => {}, lastCodeWrong = null) {
    if (lastCodeWrong)
      this.emit('debug', 'SteamGuard code was incorrect for %s. Retrying in 30 seconds.', self.getAccountName())
    
    setTimeout(function generateNewMobileAuthenticationCode() {
      callback(this.Auth.generateNewMobileAuthenticationCode())
    }, 1000 * 5)
  })
  this.client.on('loginKey', function clientLoginKeyHandler(loginKey) {
    this.emit('debug', 'Received a loginKey. This key must be removed if changing ip\'s.')
    this.Auth._updateAccountDetails({loginKey: loginKey})
  })
  this.client.on('error', function clientErrorHandler(error) {
    this.emit('error', "Error on %s for SteamUser %s", self.getAccountName(), error)
  })

  // 
  this.Profile = new Profile(this.Tasks, this.community, this.Auth)
  this.Profile.displayName = this.displayName
  // Profile event listeners and emitters
  this.Profile.on('error', function profileErrorHandler(error) {
    this.emit('error', ...error)
  })
  this.Profile.on('debug', function profileDebugHandler(debugData) {
    this.emit('debug', ...debugData)
  })

  //
  this.Friends = new Friends(this, this.Request)
  // Friends event listeners and emitters
  this.Friends.on('error', function friendsErrorHandler(error) {
    this.emit('error', ...error)
  })
  this.Friends.on('debug', function friendsDebugHandler(debugData) {
    this.emit('debug', ...debugData)
  })

  //
  this.Trade = new this.Trade(this.TradeOfferManager, this.Auth, this.Tasks, this.settings)
  // Trade event listeners and emitters
  this.Trade.on('error', function tradeErrorHandler(error) {
    this.emit('error', ...error)
  })
  this.Trade.on('debug', function tradeDebugHandler(error) {
    this.emit('error', ...error)
  })

  // todo [] - again like with request we have Community and community why?
  this.Community = new Community(this.community, this.Auth)
  // Community event listeners and emitters
  this.errorCommunity = function handleErrorCommunity(args) {
    this.emit('error', ...args)
  }
  this.Community.on('error', this.errorCommunity)
  this.Community.removeListener('error', this.errorCommunity)

  callback()
}

/**
 * Get the account's username, used to login to Steam
 * @returns {String} username
*/
Bot.prototype.getAccountName = function getAccountName() {
  return this.username
}

/**
 * Set the user we are chatting with
 * @param {*|{username: *, sid: *}} chattingUserInfo
 */
Bot.prototype.setChatting = function (chattingUserInfo = null) {
  // todo [] - should check if keys username and sid exist, however I am not sure
  // what the * stand for, wildcards I am assuming but * | {} doesn't make a lot
  // of sense to me
  if (chattingUserInfo !== null)
    this.currentChatting = chattingUserInfo
}

/**
 * Fetch SteamID Object from the Individual Account ID (i.e 46143802)
 * @returns {Error | String}
 */
Bot.prototype.getUserFromAccountID = function getUserFromAccountID(id = null) {
  if (id !== null)
    return SteamID.fromIndividualAccountID(id)
  else 
    return new Error('Invalid user ID!')
}

/**
 * Fetch SteamID Object from the Individual Account ID (i.e 46143802)
 * @returns {Error | String}
 * @deprecated
 */
 Bot.prototype.fromIndividualAccountID = function fromIndividualAccountID(id = null) {
  if (id !== null)
    return this.getUserFromAccountID(id)
  else
    return new Error('Invalid user ID!')
}

/**
 * This method simply destroys this instance of the object and recreates it. (Get rid of all data)
 */
Bot.prototype.destroyAndRecreate = function destroyAndRecreate(callback = () => {}) {
  this.emit('recreate', callback)
}

/**
 * Fetch SteamID Object from the SteamID2, SteamID3, SteamID64 or Tradeurl.
 * @returns {Error | SteamID}
 */
Bot.prototype.getUser = function (steamId = null) {
  if (steamId !== null)
    return new SteamID(steamId)
  else 
    return new Error('Invalid Steam ID')
}

/**
 * Get the display name of the account
 * @returns {String|undefined} displayName - Display name of the account
 * @deprecated
*/
// todo [] - if getDisplayName is deprecated, it should be deleted!
// todo [] - confirm getDisplayName is not used anywhere
// todo [] - getDisplayName() is a wrapper for Profile.getDisplayName()
Bot.prototype.getDisplayName = function getDisplayName() {
  return this.Profile ? this.Profile.getDisplayName() : this.username
}

/**
 * Get the SteamID of the Bot
 */
Bot.prototype.getSteamID = function getSteamID() {
    return this.SteamID ? this.SteamID : this.steamid64
}

/**
 * Change the display name of the account (with prefix)
 * @param {String} newName - The new display name
 * @param {String} namePrefix - The prefix if there is one (Nullable)
 * @param {callbackErrorOnly} callbackErrorOnly - A callback returned with possible errors
 * @deprecated
 */
// todo [] - confirm where and whether changeName method is used, if it is deprecated
// it should be deleted
Bot.prototype.changeName = function changeName(newName = null, namePrefix = null, callbackErrorOnly = () => {}) {
  if (newName !== null && namePrefix !== null) 
    this.Profile.changeDisplayName(newName, namePrefix, callbackErrorOnly)
  else
    (function (){
      const err = new Error('New name and name prefix were not provided')
      callbackErrorOnly(err)
    })()
}

/**
 * Retrieve account inventory based on filters
 * @param {Integer} appid - appid by-which to fetch inventory based on.
 * @param {Integer} contextId - contextId of lookup (1 - Gifts, 2 - In-game Items, 3 - Coupons, 6 - Game Cards, Profile Backgrounds & Emoticons)
 * @param {Boolean} tradableOnly - Items retrieved must be tradable
 * @param {inventoryCallback} inventoryCallback - Inventory details (refer to inventoryCallback for more info.)
 * @deprecated
 */
// todo [] check where this method is used, and delete if deprecated...
Bot.prototype.getInventory = function getInventory(appid = null,
  contextId = null, tradableOnly = null, inventoryCallback = () => {}) 
{
  // todo [] if this method is not in fact deprecated, do null checks and IIFE 
  // like in changeName() method above
  this.Trade.getInventory(appid, contextId, tradableOnly, inventoryCallback);
};

/**
 * Retrieve account inventory based on filters and provided steamID
 * @param {SteamID} steamID - SteamID to use for lookup of inventory
 * @param {Integer} appid - appid by-which to fetch inventory based on.
 * @param {Integer} contextId - contextId of lookup (1 - Gifts, 2 - In-game Items, 3 - Coupons, 6 - Game Cards, Profile Backgrounds & Emoticons)
 * @param {Boolean} tradableOnly - Items retrieved must be tradableOnly
 * @param {inventoryCallback} inventoryCallback - Inventory details (refer to inventoryCallback for more info.)
 * @deprecated
 */
// todo [] check where getUserInventory is used, then delete this method if
// actually deprecated
// todo [] if not deprecated and actually used, need to add null checks like in
// methods above
// todo [] this method is a wrapper for Trade.getUserInventory()
Bot.prototype.getUserInventory = function getUserInventory(steamID = null, 
  appid = null, contextId = null, tradableOnly = null,
  inventoryCallback = () => {}) {
  if (!this.loggedIn)
      return inventoryCallback("Not Logged In");
  else
      this.Trade.getUserInventory(steamID, appid, contextid, tradableOnly, inventoryCallback);
};

// testing
const un = 'hello', pass = 'test', details = {a: 1}, settings = {b: 2}
const myBot = new Bot(un, pass, details, settings)

// console.log({myBot}) printSelf is the same as this
myBot.printSelf()

// try {
//   const mySecondBot = new Bot(details, settings, details, settings)
//   mySecondBot.printSelf()
// } catch (error) {
//   console.error(error)
// }

// export Bot class
module.exports = Bot
