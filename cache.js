const level = require('level-rocksdb');
let answersCache = level("./answerscache");
//let guessesCache = {".....": guesses};

module.exports = { answersCache };

