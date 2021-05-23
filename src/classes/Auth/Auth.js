'use-strict'

const { timingSafeEqual } = require('crypto')
const Events = require('events')

/**
 * 
 */
class Auth extends Events {
  constructor (props) {
    super()
  }
}

/**
 * 
 */
Auth.prototype.setSettings = function setAuthSettings(settings = {}) {
  this.settings = settings
}

module.exports = Auth
