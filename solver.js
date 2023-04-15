import fs from "fs";

import { createNode, processNode } from './node.js';
import { processedCache } from './cache.js';
import { answers } from './answers.js';
import { guesses } from './guesses.js';
import { getMatchingAnswers } from './regex.js';

let queue = [];

if (!fs.existsSync('./solve')) {
	fs.mkdirSync('./solve');
}

let setResult = function(node, result) {
	node.result = result;
	pruneGuess(node[node.parentKey], node.guess);
}

queue.push(createNode({
	known: [],
	misplaced: [[],[],[],[],[]],
	missing: [],
	counts: {},
}, 0));

let pruneGuess = async function(node, guess) {
	if (!node)
		return;
	let complete = true;
	let answerSet = new Set();
	let incomplete = 0;
	for (let i=0; i<node.guessOutcomes[guess].length; i++) {
		let outcome = node.guessOutcomes[guess][i];
		if (outcome.result === true) {
			let oldSize = answerSet.size;
			let answers = await getMatchingAnswers(outcome.validAnswersRegex);
			answerSet = new Set([...answerSet, ...answers]);
			console.log("prune: winner adding", guess, oldSize, answerSet.size);
		}
		else if (outcome.result === false) {
			console.log("prune failed node!", node.guesses);
			node.guessOutcomes[guess].splice(i--, 1);
		}
		else {
			complete = false;
			incomplete++;
		}
	}
	if (complete) {
		let answers = await getMatchingAnswers(node.validAnswersRegex);
		if (answerSet.size !== answers.length || node.guessOutcomes[guess].length ===0) {
			console.log("prune: delete guess", guess, node.guesses, node.guessOutcomes[guess].length, answerSet.size);
			delete node.guessOutcomes[guess];
			if (Object.keys(node.guessOutcomes).length===0) {
				console.log("prune node", node.guesses, guessed(node));
				setResult(node, false);
			}
		} else {
			console.log("prune a winner!", node.guesses, guessed(node), answerSet.size);
			setResult(node, true);
		}
	} else {
		console.log("prune: waiting on results", incomplete);
	}
}

async function drainQueue() {
	while (queue.length > 0) {
		let key = queue.shift();
		try {
			let cached = await processedCache.get(key);
		} catch (NotFoundError) {
			await processNode(key, queue);
			await processedCache.put(key, true);
			await processedCache.put("queue", queue);
		}

	}
	console.log("done");
	await processedCache.clear(async (error) => {
		if (error) {
			console.log('processed clear error', error);
			return;
		}
		else
			console.log("cleared process queue");
	});
}

processedCache.get("queue", async (error, cachedQueue) => {
	if (error) {
		await processedCache.clear(async (error) => {
			if (error) {
				console.log('processed clear error', error);
				return;
			}
			await drainQueue();
		});
	}
	else {
		queue = cachedQueue.split(",");
		console.log("found previous queue", queue.length);
		await drainQueue();
	}
});

// Right poistion x....
// Wrong position x AND (?!x....)
// No match ?!x

// "glove".match(/.l[^q].[^ytp](?<!([sdf].*))(?<=v.*)(?<=g.*)/)
// Search words with letters in known positions.
// Without missing characters (in alphabetical order)
// Without characters in wrong positions (by position and alphabetical order)
// With known characters in unknown positions (in alphabetical order)

// Note that without conditions are restrictions on answers, but not on guesses.
// It is conceivable a word that isn't a valid answer is the best guess.

