var preldb = require('../index.js')

var db = preldb.open('foo')
// db._addval('foo')
// db._addval('bar')
// db._setval(0, 1)
db.set('baz', Array(512 * 2 + 1).join('X'))
db.set('baz', 'baz')
db.set('qux', 'qux')
console.log(db.entries())