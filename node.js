import fs, { promises as fsp } from 'fs';

import { answers } from './answers.js';
import { enumerateOutcomes } from './outcomes.js';
import { constructGuessesRegex, constructAnswersRegex, regexToHash } from './regex.js';
import { getMatchingAnswers, clearMatchingAnswers } from './cache.js';

const shardCache = new Map();
const dirtyShards = new Set();

function readShard(filename) {
  if (shardCache.has(filename)) return shardCache.get(filename);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filename));
  } catch {
    data = {};
  }
  shardCache.set(filename, data);
  return data;
}

async function flushShards() {
  const writes = [...dirtyShards].map(filename =>
    fsp.writeFile(filename, JSON.stringify(shardCache.get(filename)), "utf8")
  );
  await Promise.all(writes);
  dirtyShards.clear();
  shardCache.clear();
}

let createNode = function(outcome, guesses) {
  let node = {...outcome};
  node.validGuessesRegex = constructGuessesRegex(outcome);
  node.validAnswersRegex = constructAnswersRegex(outcome, answers);
  node.key = regexToHash(node.validAnswersRegex);
  node.guesses = guesses;
  let filename = `./solve/${node.key.substr(-5)}.json`;
  const shard = readShard(filename);
  const existingNode = shard[node.key];
  if (existingNode) {
    if (!existingNode.guesses || guesses < existingNode.guesses) {
      existingNode.guesses = guesses;
      shard[node.key] = existingNode;
      dirtyShards.add(filename);
    }
  } else {
    shard[node.key] = node;
    dirtyShards.add(filename);
  }
  return node.key;
}

let nodeExists = function(key) {
  let filename = `./solve/${key.substr(-5)}.json`;
  return key in readShard(filename);
}

let saveNode = function(node) {
  let filename = `./solve/${node.key.substr(-5)}.json`;
  const shard = readShard(filename);
  shard[node.key] = node;
  dirtyShards.add(filename);
}

let loadNode = function(key) {
  let filename = `./solve/${key.substr(-5)}.json`;
  return readShard(filename)[key];
}

let processNode = async function(key, queue = [], bustCache = false) {
  let node = loadNode(key);
  if (bustCache) {
    clearMatchingAnswers(node.validAnswersRegex);
  }
  const remainingAnswers = await getMatchingAnswers(node.validAnswersRegex);
  node.guessOutcomes = {};
  if (!!process.env.MAX_LENGTH && remainingAnswers.length>process.env.MAX_LENGTH) {
    queue.push(key);
    return false;
  }
  for (let i=0; i<remainingAnswers.length; i++) {
    let guess = remainingAnswers[i];
    node.guessOutcomes[guess] = [];
    let outcomes = enumerateOutcomes(guess, node);
    for (let j=0; j<outcomes.length; j++) {
      let answerRegex = constructAnswersRegex(outcomes[j], answers);
      let guessRegex = constructGuessesRegex(outcomes[j]);
      //let validGuesses = guessesCache[guessRegex] ||= guesses.filter((w) => { return !!w.match(new RegExp(guessRegex))});
      let validAnswers = await getMatchingAnswers(answerRegex, remainingAnswers);
      if (validAnswers.length === 0){
        if (process.env.DEBUG) console.log("no valid answers", answerRegex, outcomes[j]);
        outcomes.splice(j--, 1);
        continue;
      }
      node.guessOutcomes[guess].push(createNode(outcomes[j], node.guesses+1));
    }
    console.log(node.guesses, guess, outcomes.length, `${i+1}/${remainingAnswers.length}`, queue.length, node.validAnswersRegex, key);
    queue.unshift(...node.guessOutcomes[guess]);
  }
//  let newOutcomes = Object.values(node.guessOutcomes).flat();
//  queue.unshift(...newOutcomes);
  saveNode(node);
  await flushShards();
  return true;
}

let nodeHeight = async function(key) {
  let node = loadNode(key);

  const answers = await getMatchingAnswers(node.validAnswersRegex);

  if (answers.length <=2) {
    return answers.length;
  }
  let minHeight = answers.length;
  for (let i=0; i<answers.length; i++) {
    let outcomes = node.guessOutcomes[answers[i]];
    let maxOutcome = 0;
    if (process.env.DEBUG && !outcomes) {
      maxOutcome = answers.length;
      continue;
    }
    for (let j=0; j<outcomes.length; j++) {
      let outcomeHeight = await nodeHeight(outcomes[j]);
      if (outcomeHeight > maxOutcome) {
        maxOutcome = outcomeHeight;
      }
    }
    if (maxOutcome <= minHeight) {
      minHeight = maxOutcome;
      if (node.guesses ===0)
        console.log("Min height:", minHeight, answers[i]);
    }
  }
  return minHeight;
}

export { createNode, loadNode, processNode, nodeExists, nodeHeight };

