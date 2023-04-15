import level from 'level-rocksdb';

let answersCache = level("./answerscache");
//let guessesCache = {".....": guesses};
let processedCache = level("./processedcache");

export { answersCache, processedCache };

