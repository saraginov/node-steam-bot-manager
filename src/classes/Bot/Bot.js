'use strict'

const Events = require('events')
const request = require('request');
const SteamCommunity = require('steamcommunity');
const SteamUser = require('steam-user');
const SteamStore = require('steamstore');
const TradeOfferManager = require('steam-tradeoffer-manager');

const {
  typeOfStr,
  objHasProperty,
  objHasProperties,
} = require('../../util/util.js')

const { defaultBotSettings } = require('./defaultBotSettings.js')

const Auth = require('../Auth/Auth.js');
const Profile = require('../Profile/Profile.js');

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
Bot.prototype.initUser = function botInitUser(options = {}, callback = () => {}) {
  const allOpts = {}
  // todo not sure what request.defaults does
  if(objHasProperty('request', options))
    allOpts.request = request.defaults(options.request)

  this.community = new SteamCommunity(allOpts);

  // client refers to SteamUser as a client, i.e. Steam is service, we are client
  this.client = new SteamUser({promptSteamGuardCode: false})

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

  // 
  this.Profile = new Profile(this.Tasks, this.community, this.Auth);

  //
  this.Friends = new Friends(this, this.Request)

  // todo [] - again like with request we have Community and community why?
  this.Community = new Community(this.community, this.Auth);

  // this.Request event listeners and emitters ---------------------------------
  this.Request.on('error', function botRequestErrorHandler(args) {
    this.emit('error', ...args)
  })
  self.Request.on('debug', function botRequestDebugHandler(args) {
    self.emit('debug', ...args);
  });

  callback()
}

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
module.exports = Bot;
