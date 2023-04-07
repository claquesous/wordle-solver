const level = require('level-rocksdb');
const fs = require("fs");
const crypto = require('crypto');

const DEBUG = false;
const MAX_GUESSES = 6;

let guesses = fs.readFileSync("words.txt", "utf8").split("\n");
guesses.pop();
let answers = fs.readFileSync("answers.txt", "utf8").split("\n");
answers.pop();

let queue = [];

let answersCache = level("./answerscache");
//let guessesCache = {".....": guesses};

let root;
let lastWrite = 0;

if (!fs.existsSync('./solve')) {
	fs.mkdirSync('./solve');
}

let relink = function(node) {
	if (!Object.hasOwn(node, "result") && Object.keys(node.guessOutcomes).length === 0) {
		queue.push(node);
	}
	Object.keys(node.guessOutcomes).forEach((guess) => {
		node.guessOutcomes[guess].forEach((outcome) => {
			outcome.parentKey = Symbol();
			outcome[outcome.parentKey] = node;
			relink(outcome);
		});
	});
}

let setResult = function(node, result) {
	node.result = result;
	pruneGuess(node[node.parentKey], node.guess);
}

let constructGuessesRegex = function({known, misplaced, counts}) {
	let knownArray = [".",".",".",".","."];
	let knownCounts = {};
	let knownCount = 0;
	let regex;
	for (let i=0; i<5; i++) {
		if (!!known[i]) {
			knownArray[i] = known[i];
			knownCounts[known[i]] = (knownCounts[known[i]] || 0) + 1;
			knownCount++;
		}
	}
	regex = knownArray.join("");
	if (knownCount === 5) return regex;
	Object.keys(counts).sort().forEach((letter) => {
		if (!knownCounts[letter] || counts[letter] > knownCounts[letter])
			regex = regex.concat(`(?<=(${letter}.*){${counts[letter]}})`);
	});
	return regex;
};

let constructAnswersRegex = function({known, misplaced, missing, counts}) {
	let knownArray = [".",".",".",".","."];
	let knownCounts = {};
	let knownCount = 0;
	let regex;
	let totalCount = 0;
	for (let i=0; i<5; i++) {
		if (!!known[i]) {
			knownArray[i] = known[i];
			knownCounts[known[i]] = (knownCounts[known[i]] || 0) + 1;
			knownCount++;
		}
	}
	for (let i=0; i<5; i++) {
		let mysteryLetters = misplaced[i].sort().filter((letter) => {
			if (missing.includes(letter) && knownCounts[letter] === counts[letter]) {
				return false;
			}
			return true;
		});
		if (!known[i] && (mysteryLetters.length > 0)) {
			knownArray[i] = `[^${mysteryLetters.join("")}]`;
		}
	}
	regex = knownArray.join("");
	if (knownCount === 5) return regex;
	Object.keys(counts).sort().forEach((letter) => {
		totalCount += counts[letter];
		if (!knownCounts[letter] || counts[letter] > knownCounts[letter]) {
			regex = regex.concat(`(?<=(${letter}.*){${counts[letter]}})`);
		}
		if (missing.includes(letter)) {
			regex = regex.concat(`(?<=([^${letter}].*){${5-counts[letter]}})`);
		}
	});
	if (missing.length > 0 && totalCount <5) {
		let filtered = missing.filter((x)=>{return !counts[x]});
		regex = regex.concat(`(?<!([${[...new Set(filtered.sort())].join("")}].*))`);
	}
	return regex;
};

let createNode = function(outcome, guesses) {
	let node = {...outcome};
	node.validGuessesRegex = constructGuessesRegex(outcome);
	node.validAnswersRegex = constructAnswersRegex(outcome);
	const hash = crypto.createHash('sha1');
	hash.update(node.validAnswersRegex);
	node.key = hash.digest('hex');
	node.guesses = guesses;
	let filename = `./solve/${node.key.substr(-5)}.json`;
	try {
		const existingNode = require(filename)[node.key];

		if (!existingNode.guesses || guesses < existingNode.guesses) {
			existingNode.guesses = guesses;
			saveNode(existingNode);
		}
	} catch (error) {
		saveNode(node);
	}
	return node.key;
}

let saveNode = function(node) {
	let filename = `./solve/${node.key.substr(-5)}.json`;
	let nodes;
	try {
		nodes = require(filename);
	} catch (error) {
		nodes = {};
	}
	nodes[node.key] = node;
	const string = JSON.stringify(nodes);
	fs.writeFileSync(filename, string, "utf8");
}

queue.push(createNode({
	known: [],
	misplaced: [[],[],[],[],[]],
	missing: [],
	counts: {},
}, 0));

let validOutcome = function({known, misplaced, missing, counts}) {
	const knownCount = known.filter((x) => {return !!x}).length;
	const minimumMisplacedCount = new Set(misplaced.reduce((arr,x) => {return arr.concat(x)}, [])).size;
	if (Object.keys(counts).reduce((sum,letter) => {return sum+counts[letter];}, 0)>5 ) {
		if (DEBUG) console.log("too many", known, misplaced);
		return false;
	}
	for (let i=0; i<5; i++) {
		if (!!known[i] && misplaced[i].includes(known[i])) {
			if (DEBUG) console.log("same character right position and wrong", i, known, misplaced);
			return false;
		}
	}
	return true;
}

let enumerateOutcomes = function(word, {known, misplaced, missing, counts}) {
	let outcomes = [];
	for (let i=0; i<243; i++) {
		let valid = true;
		let node = {
			known: [],
			misplaced: [[],[],[],[],[]],
			missing: [],
			counts: {},
		};
		for (let j=0; j<5; j++) {
			let outcome = (Math.floor(i/(3**j)))%3;
			let letter = word.charAt(j);
			switch (outcome) {
				case 0:
					node.known[j] = letter;
					node.misplaced[j] = [];
					node.counts[letter] = !node.counts[letter] ? 1 : node.counts[letter]+1;
					if (!!known[j] && node.known[j] !== known[j]){
						if (DEBUG) console.log("invalid known", j, node.known[j], known[j]);
						valid = false;
					}
					break;
				case 1:
					node.misplaced[j].push(letter);
					node.counts[letter] = !node.counts[letter] ? 1 : node.counts[letter]+1;
					if (!!known[j]) {
						if (DEBUG) console.log("invalid misplaced", j, known[j]);
						valid = false;
					}
					break;
				case 2:
					node.missing.push(letter);
					if (!!known[j]) {
						if (DEBUG) console.log("invalid missing", j, known[j]);
						valid = false;
					}
					break;
			}
		}
		Object.keys(counts).forEach((letter) => {
			let count = 0;
			for (let j=0; j<5; j++) {
				if (node.known[j]===letter || node.misplaced[j].includes(letter)) {
					count++;
				}
			}
			if (count < counts[letter]){
				valid = false;
				if (DEBUG) console.log("invalid counts", count, counts[letter]);
			}
		});
		Object.keys(node.counts).forEach((letter) => {
			if ((!counts[letter] || (node.counts[letter] > counts[letter])) && missing.includes(letter)) {
				valid = false;
				if (DEBUG) console.log("invalid count was missing", letter, node.counts, counts, missing);
			}
		});
		if (valid) {
			for (let j=0; j<5; j++) {
				if (node.known[j] || known[j]) {
					node.known[j] = node.known[j] || known[j];
				}
				node.misplaced[j] = [...new Set(node.misplaced[j].concat(misplaced[j]).sort())]; 
			}
			node.missing = [...new Set(node.missing.concat(missing).sort())];
			Object.keys(counts).forEach((letter) => {
				if (!node.counts[letter] || node.counts[letter] < counts[letter]) {
					node.counts[letter] = counts[letter];
				}
			});
			outcomes.push(node);
		}
	}
	return outcomes.filter(validOutcome);
}

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
			let cachedAnswers = await answersCache.get(outcome.validAnswersRegex);
			let answers = cachedAnswers.split(",");
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
		let cachedAnswers = await answersCache.get(node.validAnswersRegex);
		let answers = cachedAnswers.split(",");
		if (answerSet.size !== answers.length || node.guessOutcomes[guess].length ===0) {
			console.log("prune: delete guess", guess, node.guesses, node.guessOutcomes[guess].length, answerSet.size, answersCache[node.validAnswersRegex].length);
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

let guessed = function(node) {
	let guesses=[];
	while (!!node.guess) {
		guesses.push(node.guess);
		node=node[node.parentKey];
	}
	return guesses;
}

let processNode = async function(key) {
	let node = require(`./solve/${key.substr(-5)}.json`)[key];
//	if (node.hasOwnProperty('guessOutcomes'))
//		return;
	node.guessOutcomes = {};
	const answersString = await answersCache.get(node.validAnswersRegex);
	const answers = answersString.split(",");
	if (answers.length <= 2) {
	//	if (answers.length !== (MAX_GUESSES-node.guesses))
	//		console.log("prune winner: plenty of guesses", MAX_GUESSES-node.guesses, answers.length);
	//	setResult(node, true);
		return;
	}
	//if (node.guesses === MAX_GUESSES-1) {
	//	setResult(node, false);
	//	return;
	//}
	for (let i=0; i<answers.length; i++) {
		let guess = answers[i];
/*		if (node.guesses===0)
			guess = "chump";*/
		node.guessOutcomes[guess] = [];
		//if (guessed(node).includes(guess))
		//	continue;
		let outcomes = enumerateOutcomes(guess, node);
		let answerOutcomes = [];
		if (node.guesses===MAX_GUESSES-2)
			if (DEBUG) console.log("outcomes", outcomes.length, outcomes);
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
				if (DEBUG) console.log("no valid answers", guessRegex, guesses, outcomes[j]);
				outcomes.splice(j--, 1);
				continue;
			}
/*			if (!!node.parentKey && answerRegex == node[node.parentKey].validAnswersRegex) {
				console.log("unhelpful outcome", guess, outcomes.length, answerRegex, guessRegex);
				outcomes.splice(j--, 1);
				continue;
			} else if (!!node.parentKey) {
				if (DEBUG) console.log("helpful", answerRegex, node[node.parentKey].validAnswersRegex);
			}
			if (node.guesses === MAX_GUESSES-2){
				if (DEBUG) console.log(outcomes[j], answerRegex, validAnswers);
			}*/
			node.guessOutcomes[guess].push(createNode(outcomes[j], node.guesses+1));
			answerOutcomes.push(...validAnswers);
		}
		if (outcomes.length===0) {
			continue;
		}
		console.log(node.guesses, guess, outcomes.length, `${i+1}/${answers.length}`, queue.length, node.validAnswersRegex, key);
		if (new Set(answerOutcomes).size !== answers.length) {
			console.log("answers don't match (previous answers, new outcomes set)", guess, answers.length, new Set(answerOutcomes).size);
			let iterator = node;
			while (iterator.guesses !==0) {
				let parentKey = iterator.parentKey;
				let {guessOutcomes, ...loggable} = iterator;
				console.log(loggable);
				console.log(constructAnswersRegex(iterator));
				console.log(constructGuessesRegex(iterator));
				iterator = iterator[parentKey];
			}
			exit(2);
		}
		queue.unshift(...node.guessOutcomes[guess]);
		queue = [...new Set(queue)];
/*		if (node.guesses ===0)
			break;*/
	}
/*	let newOutcomes = Object.values(node.guessOutcomes).flat();
	if (newOutcomes.length ===0) {
		console.log("prune no outcomes");
//		setResult(node, false);
	}
	else {
		queue.push(...newOutcomes);
	}*/
	saveNode(node);
}

answersCache.put(".....", answers, async function() {
	while (queue.length > 0) {
		let node = queue.shift();
		await processNode(node);
	}
});
//processNode(root);

//console.log(root.guessOutcomes);
console.log("done");

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

