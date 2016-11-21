var fs = require('fs')

var index = {}
fs.open('foo.dir', 'a+', (err, fd) => {
  if (err) throw err

  index = JSON.parse(fs.readFileSync(fd, 'ascii'))
  console.log(index)
  fs.close(fd)
})
