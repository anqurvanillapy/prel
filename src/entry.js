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

    // Randomly generated number of remaining operands to commit
    this._commitCount = 0

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

    rl.on('line', line => {
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

    fs.unlink(this._bakfile, err => { 
      if (err) { /* eat errors */}
      fs.rename(this._dirfile, this._bakfile, _ => { /* safe backup */ })      
    })

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

  _commitHelper () {
    // TODO: help with db auto-committing, based on random number
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

    fs.open(this._datfile, 'r', (err, fd) => {
      if (err) throw err

      var buf = new Buffer(100)
      fs.read(fd, buf, 0, siz, pos, (err, numBytes) => {
        if (err) throw err
        return buf.toString(ENCODING, 0, numBytes)
      })
    })
  }

  // Append val to data file, starting at a BLOCKSIZE-aligned offset. The data
  // file is first padded with NUL bytes (if needed) to get to an aligned
  // offset. Return pair
  //    "[pos, val.length]"
  _addval (val) {
    fs.open(this._datfile, 'r+', (err, fd) => {
      if (err) throw err

      fs.stat(this._datfile, (err, stats) => {
        if (err) throw err

        var pos = stats['size']
        var npos = Math.floor((pos + BLOCKSIZE - 1) / BLOCKSIZE) * BLOCKSIZE
        // TODO: write val to data file
      })
    })
  }

  close () {
    // close the db
  }
}

function open (file, flag = 'c', mode = 0o666) {
  return new PrelDB(file, flag, mode)
}

export { open }
