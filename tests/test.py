from dbm import dumb


db = dumb.open('bar')
db[b'foo'] = b'foo'
db[b'bar'] = b'bar'
db.close()
