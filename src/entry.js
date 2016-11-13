'use strict'

import fs from 'fs'

const BLOCKSIZE = 512
const ENCODING = 'ascii'

class PrelDB {
  constructor (fbname, flag = 'c', mode) {
    this._mode = mode

    // The directory file, whose each line looks like
    //    "key, (pos, siz)"
    // that points to the data file
    this._dirfile = fbname + '.dir'

    // The data file, aligned by BLOCKSIZE
    this._datfile = fbname + '.dat'

    // The backup file
    this._bakfile = fbname + '.bak'

    // The in-memory mapping that mirrors the directory file
    this._index = undefined // maps key to a (pos, siz) pair

    // Handle the creation
    this._create(flag)
    this._update()
  }

  _create (flag) {
    if (flag === 'n') {
      [this._dirfile, this._datfile, this._bakfile].forEach(f => {
        fs.unlink(f, _ => { /* eat errors */ })
      })
    }

    fs.readFile(this._datfile, ENCODING, (err, data) => {
      if (err) {
        fs.writeFile(this._datfile, ENCODING, '', err => {
          if (err) throw err
          fs.chmod(this._datfile, this._mode)
        })
      }
    })
  }

  _update () {
    this._index = {}

    fs.readFile(this._dirfile, ENCODING, (err, data) => {
      if (err) { /* eat errors */ }
      /* read data line by line */
    })
  }

  _commit () {

  }

  _verifyOpen () {
    if (typeof this._index === 'undefined') {
      throw new Error('PrelDB object has been already closed')
    }
  }

  close () {
    /* close the db */
  }
}

function open (file, flag = 'c', mode = 0o666) {
  return new PrelDB(file, flag, mode)
}

export { open }
