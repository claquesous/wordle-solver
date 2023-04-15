import level from 'level-rocksdb';

let answersCache = level("./answerscache.js");
//let guessesCache = {".....": guesses};
let processedCache = level("./processedcache");

export { answersCache, processedCache };

