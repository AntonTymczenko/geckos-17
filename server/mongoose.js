const mongoose = require('mongoose'),
  options = {
    useMongoClient: true
  }
mongoose.Promise = global.Promise

module.exports = dburl => {
  mongoose.connect(dburl, options)
    .then(() => console.log(`Connected to database ${dburl}`))
    .catch(err => console.log(err))
}
