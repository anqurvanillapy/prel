var fs = require('fs')

const BLOCKSIZE = 512

class DataBaseManager {
  constructor (fbname, flag = 'c', mode) {
    this._mode = mode

    // The directory file, whose each line looks like
    //    "key, (pos, siz)"
    // that points to the data file
    this._dirfile = fbname + '.dir'

    // The data file, aligned by _BLOCKSIZE
    this._datfile = fbname + '.dat'

    // The backup file
    this._bakfile = fbname + '.bak'

    // The in-memory mapping that mirrors the directory file
    this._index = undefined // maps key to a (pos, siz) pair

    // Handle the creation
    this._create(flag)
    // this._update()
  }

  _create (flag) {
    console.log(flag)
    if (flag === 'n') {
      [this._dirfile, this._datfile, this._bakfile].forEach(f => {
        fs.unlink(f, _ => {})
      })
    }
  }
}

function open (file, flag = 'c', mode = 0o666) {
  return new DataBaseManager(file, flag, mode)
}

export { open }
