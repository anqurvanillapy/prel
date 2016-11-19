var preldb = require('../index.js')

var db = preldb.open('foo')
db._addval('foo')
db._addval('bar')
