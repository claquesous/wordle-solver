import fs from 'fs';

import { answers } from './answers.js';
import { enumerateOutcomes } from './outcomes.js';
import { constructGuessesRegex, constructAnswersRegex, regexToHash } from './regex.js';
import { getMatchingAnswers } from './cache.js';

let createNode = function(outcome, guesses) {
  let node = {...outcome};
  node.validGuessesRegex = constructGuessesRegex(outcome);
  node.validAnswersRegex = constructAnswersRegex(outcome, answers);
  node.key = regexToHash(node.validAnswersRegex);
  node.guesses = guesses;
  let filename = `./solve/${node.key.substr(-5)}.json`;
  try {
    const existingNode = JSON.parse(fs.readFileSync(filename))[node.key];

    if (!existingNode.guesses || guesses < existingNode.guesses) {
      existingNode.guesses = guesses;
      saveNode(existingNode);
    }
  } catch (error) {
    saveNode(node);
  }
  return node.key;
}

let nodeExists = function(key) {
  let filename = `./solve/${key.substr(-5)}.json`;
  let nodes;
  try {
    nodes = JSON.parse(fs.readFileSync(filename));
    return Object.keys(nodes).indexOf(key) >= 0;
  } catch (error) {
    return false;
  }
}

let saveNode = function(node) {
  let filename = `./solve/${node.key.substr(-5)}.json`;
  let nodes;
  try {
    nodes = JSON.parse(fs.readFileSync(filename));
  } catch (error) {
    nodes = {};
  }
  nodes[node.key] = node;
  const string = JSON.stringify(nodes);
  fs.writeFileSync(filename, string, "utf8");
}

let loadNode = (key) => JSON.parse(fs.readFileSync(`./solve/${key.substr(-5)}.json`))[key];

let processNode = async function(key, queue = []) {
  let node = loadNode(key);
  const remainingAnswers = await getMatchingAnswers(node.validAnswersRegex);
  node.guessOutcomes = {};
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

