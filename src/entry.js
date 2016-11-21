'use strict'

import fs from 'fs'

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
        fs.unlinkSync(f)
      })
    }

    var fd = fs.openSync(this._datfile, 'a+')
    fs.chmodSync(this._datfile, this._mode)
    fs.closeSync(fd)
  }

  // Read the directory to the in-memory index object
  _update () {
    this._index = {}

    var fd = fs.openSync(this._dirfile, 'a+')
    try {
      this._index = JSON.parse(fs.readFileSync(fd, ENCODING))
    } catch (e) {
      // eat errors
    } finally {
      fs.closeSync(fd)
    }
  }

  // Write the index object to the directory file. The original directory file
  // (if any) is renamed with .bak extension for backup first. If a backup
  // exists, it's deleted.
  _commit () {
    if (typeof this._index === 'undefined') return // it's closed

    try {
      fs.unlinkSync(this._bakfile)
      fs.renameSync(this._dirfile, this._bakfile)
    } catch (e) { /* eat errors */ }

    var fd = fs.openSync(this._dirfile, 'w')
    fs.writeSync(fd, `${JSON.stringify(this._index, null, '\t')}\n`, ENCODING)
    fs.chmodSync(this._dirfile, this._mode)
    fs.closeSync(fd)
  }

  _autoCommit () {
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
    var ret = null

    try {
      // Destructuring can raise TypeError if no matches
      var [pos, siz] = this._index[key]
      var fd = fs.openSync(this._datfile, 'r')
      var buf = Buffer.alloc(BLOCKSIZE)
      var bytesRead = fs.readSync(fd, buf, 0, siz, pos)
      ret = buf.toString(ENCODING, 0, bytesRead)
      fs.closeSync(fd)
    } catch (e) {
      if (!(e instanceof TypeError)) throw e
    }

    return ret
  }

  // Append val to data file, starting at a BLOCKSIZE-aligned offset. The data
  // file is first padded with NUL bytes (if needed) to get to an aligned
  // offset. Return pair
  //    "[pos, val.length]"
  _addval (val) {
    var pos = fs.statSync(this._datfile)['size']
    var npos = Math.floor((pos + BLOCKSIZE - 1) / BLOCKSIZE) * BLOCKSIZE

    // NOTE: Array(5).join('\0') returns 4 null bytes
    ;[Array(npos - pos + 1).join('\0'), val].forEach(dat => {
      fs.appendFileSync(this._datfile, dat, ENCODING)
    })

    pos = npos
    return [pos, val.toString().length]
  }

  // Write val to the data file, starting at offset pos. The caller is
  // responsible for ensuring an enough room starting at pos to hold val,
  // without overwriting some other value. Return pair [pos, val.length).
  _setval (pos, val) {
    var fd = fs.openSync(this._datfile, 'r+')
    fs.writeSync(fd, val, pos, ENCODING)
    fs.closeSync(fd)
    return [pos, val.toString().length]
  }

  // key is a new key whose associated value starts in the data file at offset
  // pos with length siz. Add an index record to the in-memory index object, and
  // append one to the directory file.
  _addkey (key, pair) {
    this._index[key] = pair
    var fd = fs.openSync(this._dirfile, 'w')
    fs.chmodSync(this._dirfile, this._mode)
    fs.writeSync(fd, `${JSON.stringify(this._index, null, '\t')}\n`, ENCODING)
  }

  set (key, val) {
    this._verifyOpen()

    if (!(key in this._index)) {
      this._addkey(key, this._addval(val))
    } else {
      var [pos, siz] = this._index[key]
      var [oldblocks, newblocks] = [siz, val.toString().length].map(len => {
        return Math.floor((len + BLOCKSIZE - 1) / BLOCKSIZE)
      })

      if (newblocks <= oldblocks) {
        this._index[key] = this._setval(pos, val)
      } else {
        // The new value doesn't fit in the padded space used by the old value.
        // And the blocks used by the old value are forever lost.
        this._index[key] = this._addval(val)
      }
    }

    this._autoCommit()
  }

  delete (key) {
    this._verifyOpen()
    delete this._index[key]
    this._autoCommit()
  }

  keys () {
    this._verifyOpen()
    return Object.keys(this._index)
  }

  entries () {
    this._verifyOpen()
    return Object.keys(this._index).map(el => { return [el, this._index[el]] })
  }

  contains (key) {
    this._verifyOpen()
    return key in this._index
  }

  close () {
    // close the db
  }
}

function open (file, flag = 'c', mode = 0o666) {
  return new PrelDB(file, flag, mode)
}

export { open }
