import level from 'level-rocksdb';
import { applyRegex } from './regex.js';
import { answers } from './answers.js';

let answersCache = level("./answerscache");
//let guessesCache = {".....": guesses};
let processedCache = level("./processedcache");

let getMatchingAnswers = async function(regex, answerList = answers) {
  let matchingAnswers;
  try {
    let cachedAnswers = await answersCache.get(regex);
    matchingAnswers = cachedAnswers.split(",");
    if (matchingAnswers[0] === '')
      matchingAnswers = [];
  } catch (NotFoundError) {
    matchingAnswers = applyRegex(regex, answerList);
    await answersCache.put(regex, matchingAnswers);
  }
  return matchingAnswers;
}

let clearMatchingAnswers = async function(regex) {
  await answersCache.del(regex);
}

export { answersCache, getMatchingAnswers, clearMatchingAnswers, processedCache };

