const fs = require('fs');

const { enumerateOutcomes } = require('./outcomes');
const { constructGuessesRegex, constructAnswersRegex, regexToHash } = require('./regex');
const { answersCache } = require('./cache');

const MAX_GUESSES = 6;

let createNode = function(outcome, guesses) {
	let node = {...outcome};
	node.validGuessesRegex = constructGuessesRegex(outcome);
	node.validAnswersRegex = constructAnswersRegex(outcome);
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


let processNode = async function(key, queue = []) {
	let node = JSON.parse(fs.readFileSync(`./solve/${key.substr(-5)}.json`))[key];
//	if (node.hasOwnProperty('guessOutcomes'))
//		return;
	node.guessOutcomes = {};
	const answers = await getAnswers(node);
	if (answers.length <= 1) {
	//	if (answers.length !== (MAX_GUESSES-node.guesses))
	//		console.log("prune winner: plenty of guesses", MAX_GUESSES-node.guesses, answers.length);
	//	setResult(node, true);
		return;
	}
	for (let i=0; i<answers.length; i++) {
		let guess = answers[i];
/*		if (node.guesses===0)
			guess = "chump";*/
		node.guessOutcomes[guess] = [];
		let outcomes = enumerateOutcomes(guess, node);
		let answerOutcomes = [];
		if (node.guesses===MAX_GUESSES-2)
			if (process.env.DEBUG) console.log("outcomes", outcomes.length, outcomes);
		for (let j=0; j<outcomes.length; j++) {
			let answerRegex = constructAnswersRegex(outcomes[j]);
			let guessRegex = constructGuessesRegex(outcomes[j]);
			//let validGuesses = guessesCache[guessRegex] ||= guesses.filter((w) => { return !!w.match(new RegExp(guessRegex))});
			let validAnswers;
			try {
				let cachedAnswers = await answersCache.get(answerRegex);
				validAnswers = cachedAnswers.split(",");
			} catch (NotFoundError) {
				validAnswers = answers.filter((w) => { return !!w.match(new RegExp(answerRegex))});
				if (validAnswers.length > 0)
					await answersCache.put(answerRegex, validAnswers);
			}
			if (validAnswers.length === 0){
				if (process.env.DEBUG) console.log("no valid answers", guessRegex, guesses, outcomes[j]);
				outcomes.splice(j--, 1);
				continue;
			}
			node.guessOutcomes[guess].push(createNode(outcomes[j], node.guesses+1));
			answerOutcomes.push(...validAnswers);
		}
		if (outcomes.length===0) {
			continue;
		}
		console.log(node.guesses, guess, outcomes.length, `${i+1}/${answers.length}`, queue.length, node.validAnswersRegex, key);
		if (new Set(answerOutcomes).size !== answers.length) {
			console.log("answers don't match (previous answers, new outcomes set)", guess, answers.length, new Set(answerOutcomes).size);
			let {guessOutcomes, ...loggable} = node;
			console.log(loggable);
			console.log(constructAnswersRegex(node));
			console.log(constructGuessesRegex(node));
			exit(2);
		}
//		queue.unshift(...node.guessOutcomes[guess]);
/*		if (node.guesses ===0)
			break;*/
	}
	let newOutcomes = Object.values(node.guessOutcomes).flat();
	queue.unshift(...newOutcomes);
	saveNode(node);
}

let nodeHeight = async function(key) {
	let node = JSON.parse(fs.readFileSync(`./solve/${key.substr(-5)}.json`))[key];

	const answers = await getAnswers(node);

	if (answers.length <=2) {
		return answers.length;
	}
	let minHeight = answers.length;
	for (let i=0; i<answers.length; i++) {
		let outcomes = node.guessOutcomes[answers[i]];
		let maxOutcome = 0;
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

let getAnswers = async function(node) {
	const answersString = await answersCache.get(node.validAnswersRegex);
	return answersString.split(",");
}

module.exports = { createNode, saveNode, processNode, nodeExists, nodeHeight, getAnswers };
