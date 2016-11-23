# preldb

*pre-relational database*

**Notice:** code for learning, not for production use.

A simple JavaScript rewrite of [dbm](https://en.wikipedia.org/wiki/Dbm). But
actually started with the slow but simple version of `dbm` -
[dbm.dumb](https://hg.python.org/cpython/file/3.5/Lib/dbm/dumb.py), which is
written in Python.

Installation
------------

Not on npm. Please `git clone` & `npm install`

Usage
-----

```js
const db = require('preldb').open('dontcha')

db.set('foo', 'bar')
console.log(db.get('foo'))
//=> 'bar'

db.delete('foo')
console.log(db.contains('foo'))
//=> false

// Methods `set()` and `delete()` will trigger auto-committing.
db.sync() // manually commit some changes

db.close()
db.set('baz', 'qux')
//=> Error: PrelDB object has been already closed
```

API
---

### Method: `open(file, flag = 'c', mode = 0o666)`

Opens and returns an object of `PrelDB`, by giving a flag and Unix file mode.

- flags: `c` for creation (based on an existing one), `n` for overwriting an old
one (if any) and setting up a new store.

### Private Object: `PrelDB`

**Note:** It could only be returned by invoking `open()`, since it's private.

#### `PrelDB.set(key, value)`

Set a key-value pair.

#### `PrelDB.get(key)`

Get the associated value of `key`

#### `PrelDB.delete(key)`

Delete `key`'s value.

#### `PrelDB.sync()`

Manually commit the changes, e.g. setting and deleting.

#### `PrelDB.setAutoCommitEndpoint(value)`

This endpoint is for specifying the frequency of auto-backup.

A random number between `[0, value]` will be generated for counting the changes.
And if the number of changes reaches it, the database calls `PrelDB.sync()` to
back up the data, re-generating a random number for the next count.

`value` is 5 by default and should be larger than 0.

#### `PrelDB.keys()`

Return an array of all the keys in the store.

#### `PrelDB.entries()`

Returns an array of the `[key, value]` pairs, similar to `Object.entries()`.

#### `PrelDB.contains(key)`

Check if `key` is in the store. Return `true` if it exists.

#### `PrelDB.length`

Return the length of the `PrelDB.keys()` array.

#### `PrelDB.close()`

Close the database. The changes of the store after this method will be denied
and meet an exception.

License
-------

ISC
