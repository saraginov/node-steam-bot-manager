'use strict'

/**
 * 
 */
function typeOfStr (toCheck = null) {
  return typeof toCheck === 'string'
}

/**
 * I don't think I will be using this because I am using classes
 */
async function asyncTypeOfStr (toCheck = null) {
  return typeof toCheck === 'string'
}

/**
 * 
 */
function objHasProperty (propertyName = '', object = {}) {
  return Object.prototype.hasOwnProperty.call(propertyName, object)
}

/**
 * 
 */
function objHasProperties (propertyNames = [], object = {}) {
  let hasAllProperties = false
  for (let i = 0; i < propertyNames.length; i++) {
    const property = propertyNames[i]
    hasAllProperties = Object.prototype.hasOwnProperty.call(property, object)
    if (!hasAllProperties)
      break;
  }

  return hasAllProperties
}

module.exports = {
  typeOfStr,
  asyncTypeOfStr,
  objHasProperty,
  objHasProperties,
}
