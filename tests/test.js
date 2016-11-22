var preldb = require('../index.js')

var db = preldb.open('foo')
// db._addval('foo')
// db._addval('bar')
// db._setval(0, 1)
// db.set('baz', Array(512 * 2 + 1).join('X'))
db.set('bar', 'bar')
db.set('baz', 'baz')
db.set('qux', 'qux')
console.log(db.get('foo'))
console.log(db.get('bar'))
console.log('index entries:', db.entries())
console.log(`contains 'quux'? ${db.contains('quux')}`)
db.close()

console.log('new db created...')
var db0 = preldb.open('foo', 'n')
// db0.set('quux', 'quux')
// console.log(`contains 'quux'? ${db0.contains('quux')}`)
// db0.sync()
db0.setAutoCommitEndpoint = 8
for (let i = 0; i < 30; i++) {
  console.log('current i', i)
  db0._autoCommit()
}
db0.close()
db0._verifyOpen()
