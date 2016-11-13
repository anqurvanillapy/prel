'use strict'

import fs from 'fs'
import readline from 'readline'

const BLOCKSIZE = 512
const ENCODING = 'ascii'

class PrelDB {
  constructor (fbname, flag = 'c', mode) {
    this._mode = mode

    // The directory file, whose each line looks like
    //    "key, [pos, siz]"
    // that points to the data file
    this._dirfile = fbname + '.dir'

    // The data file, aligned by BLOCKSIZE
    this._datfile = fbname + '.dat'

    // The backup file
    this._bakfile = fbname + '.bak'

    // The in-memory mapping that mirrors the directory file
    this._index = undefined // maps key to a [pos, siz] pair

    // Handle the creation
    this._create(flag)
    this._update()
    this._commit()
  }

  _create (flag) {
    if (flag === 'n') {
      [this._dirfile, this._datfile, this._bakfile].forEach(f => {
        fs.unlink(f, _ => { /* eat errors */ })
      })
    }

    fs.writeFile(this._datfile, '', err => {
      if (err) { /* eat errors */ }
      fs.chmod(this._datfile, this._mode)
    })
  }

  // Read the directory to the in-memory index object
  _update () {
    this._index = {}
    var rs = fs.createReadStream(this._dirfile, {encode: ENCODING})

    rs.on('error', _ => {
      return // eat errors
    })

    const rl = readline.createInterface({
      input: rs
    })

    rl.on('line', (line) => {
      // Destructure a nested Array from a line
      var [key, pair] = JSON.parse('[' + line.trim() + ']')
      this._index[key] = pair // pos and siz pair
    })
  }

  // Write the index object to the directory file. The original directory file
  // (if any) is renamed with .bak extension for backup first. If a backup
  // exists, it's deleted.
  _commit () {
    if (typeof this._index === 'undefined') return // it's closed

    fs.unlink(this._bakfile, _ => { /* eat errors */ })
    fs.rename(this._dirfile, this._bakfile, _ => { /* safe backup */ })

    fs.open(this._dirfile, 'w', err => {
      if (err) throw err

      fs.chmod(this._dirfile, this._mode)
      var ws = fs.createWriteStream(this._dirfile, {defaultEncoding: ENCODING})

      Object.keys(this._index).forEach(k => {
        ws.write(k.toString() + ',[' + this._index[k].toString() + ']')
      })

      ws.end('\n')
    })
  }

  sync () { this._commit() }

  _verifyOpen () {
    if (typeof this._index === 'undefined') {
      throw new Error('PrelDB object has been already closed')
    }
  }

  get (key) {
    this._verifyOpen()

    // Destructuring can raise TypeError if no matches
    var [pos, siz] = this._index[key]
  }

  close () {
    // close the db
  }
}

function open (file, flag = 'c', mode = 0o666) {
  return new PrelDB(file, flag, mode)
}

export { open }
