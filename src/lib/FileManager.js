'use strict'

const Events = require('events')
const fs = require('fs')
// todo [x] what does glob do ?
// https://www.npmjs.com/package/glob
const glob = require('glob')

const {
  typeOfStr,
  objHasProperty,
  objHasProperties,
} = require('../../util/util.js')

/**
 * 
 */
class FileManager extends Events {
  constructor(path = null) {
    super()

    this.fileManagerPath = ''

    if (path !== null && typeOfStr(path) && !this.exists(path)) {
      try {
        this.emit('debug', 'Creating missing folder named \'%s\'', path)
        fs.mkdirSync(path)
        this.fileManagerPath = path + '/'
      } catch (error) {
        const {code = null} = error
        if(code !== 'EEXIST') throw error
      }
    }
  }
}

/**
 * todo [] why is callback called with null, should an error not be raised?
 */
async function createFolderIfNotExist( path = null, callback = async () => {} ) {
  if (!this.exists(path)) {
    try {
      const { fileManagerPath = '' } = this
      this.emit('debug', 'Creating missing folder named \'%s\'.', fileManagerPath + path)
      fs.mkdirSync(self.fileManagerPath + folderPath)
    } catch (error) {
      const { code = null } = error
      if (code !== 'EEXIST')
        return await callback(error)
    }
  }
  // unless callback returns error it always returns null
  return await callback(null)
}
FileManager.prototype.createFolderIfNotExist = createFolderIfNotExist

/**
 * 
 */
async function getFileList (pattern = null, callback = async () => {}) {
  // todo [] how come we don't check if fileManagerPath is legit/exists?
  if (pattern !== null && typeOfStr(pattern)) {
    glob(this.fileManagerPath + pattern, function globCallback(error, filesList) {
      const cleanFiles = []
      for (const fileFilter in filesList) {
        // replace used to remove absolute path and end up with file name only
        cleanFiles.push(files[fileFilter].replace(this.fileManagerPath, ''))
      }
      await callback(error, cleanFiles)
    })
  }
}
FileManager.prototype.getFileList = getFileList

/**
 * 
 */
FileManager.prototype.exists = function doesFilePathExist(filePath) {
  // todo [] - technically it works, but Is there a better way to do this?
  try {
      fs.statSync(this.fileManagerPath + filePath)
      return true
  } catch (e) {
      return false
  }
}



module.exports = FileManager;
