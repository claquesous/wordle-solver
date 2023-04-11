const level = require('level-rocksdb');
let answersCache = level("./answerscache");
//let guessesCache = {".....": guesses};
let processedCache = level("./processedcache");

module.exports = { answersCache, processedCache };

