'use strict'

/**
 * @param toCheck - string to verify type of
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
 * @param propertyName - string to match to key
 * @param object - object whose keys we are validating
 */
function objHasProperty (propertyName = '', object = {}) {
  return Object.prototype.hasOwnProperty.call(propertyName, object)
}

/**
 * @param propertyNames - an Array of strings to loop over and check whether
 * object has keys
 * @param object - object whose keys we are validating
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
