const fs = require("fs");
const DEBUG = false;

let guesses = fs.readFileSync("words.txt", "utf8").split("\n");
guesses.pop();
let answers = fs.readFileSync("answers.txt", "utf8").split("\n");
answers.pop();

let queue = [];

let answersCache = {".....": answers};
let guessesCache = {".....": guesses};

let root = {
	validGuessesRegex: ".....",
	validAnswersRegex: ".....",
	known: [],
	misplaced: [[],[],[],[],[]],
	missing: [],
	counts: {},
	parentNode: null,
	guesses: 0,
	guessOutcomes: [],
};

queue.push(root);

let constructGuessesRegex = function({known, misplaced, counts}) {
	let knownArray = [".",".",".",".","."];
	let regex;
	for (let i=0; i<5; i++) {
		if (!!known[i])
			knownArray[i] = known[i];
	}
	regex = knownArray.join("");
	Object.keys(counts).forEach((letter) => {
		regex = regex.concat(`(?<=(${letter}.*){${counts[letter]}})`);
	});
	return regex;
};

let constructAnswersRegex = function({known, misplaced, missing, counts}) {
	let knownArray = [".",".",".",".","."];
	let regex;
	for (let i=0; i<5; i++) {
		if (!!known[i]) {
			knownArray[i] = known[i];
		}
		else if(misplaced[i].length > 0) {
			knownArray[i] = `[^${misplaced[i].sort().join("")}]`;
		}
	}
	regex = knownArray.join("");
	Object.keys(counts).forEach((letter) => {
		regex = regex.concat(`(?<=(${letter}.*){${counts[letter]}})`);
		if (missing.includes(letter)) {
			regex = regex.concat(`(?<=([^${letter}].*){${5-counts[letter]}})`);
		}
	});
	if (missing.length > 0 ) {
		let filtered = missing.filter((x)=>{return !counts[x]});
		regex = regex.concat(`(?<!([${[...new Set(filtered.sort())].join("")}].*))`);
	}
	return regex;
};

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

let guessed = function(node) {
	let guesses=[];
	do {
		guesses.push(node.guess);
		node=node.parentNode;
	} while (!!node);
	return guesses;
}

let processNode = function(node) {
	if (node.guesses === 6 || answersCache[node.validAnswersRegex].length < 2) {
		if (answersCache[node.validAnswersRegex].length === 1) {
			node.result = true;
		}
		else {
			node.result = false;
		}
		return;
	}
	for (let i=0; i<guessesCache[node.validGuessesRegex].length; i++) {
		let guess = guessesCache[node.validGuessesRegex][i];
		if (node.guesses===0)
			guess = "chump";
		let outcomes = enumerateOutcomes(guess, node);
		let answerOutcomes = [];
		if (node.guesses===5)
			if (DEBUG) console.log("outcomes", outcomes.length, outcomes);
		for (let j=0; j<outcomes.length; j++) {
			let answerRegex = constructAnswersRegex(outcomes[j]);
			let guessRegex = constructGuessesRegex(outcomes[j]);
			let validGuesses = guessesCache[guessRegex] ||= guesses.filter((w) => { return !!w.match(new RegExp(guessRegex))});
			if (validGuesses.length <1){
				if (node.guesses===5) {
					console.log("no valid guesses", guessRegex, guesses, outcomes[j]);
				}
				continue;
			}
			let validAnswers = answersCache[answerRegex] ||= answers.filter((w) => { return !!w.match(new RegExp(answerRegex))});
			if (!!node.parentNode && answerRegex == node.parentNode.validAnswersRegex) {
				console.log("unhelpful outcome", guess, outcomes[j], answerRegex, validGuessRegex);
				continue;
			}
			if (node.guesses === 5){
				if (DEBUG) console.log(outcomes[j], answerRegex, validAnswers);
			}
			node.guessOutcomes.push({
				guess,
				validGuessesRegex: guessRegex,
				validAnswersRegex: answerRegex,
				...outcomes[j],
				parentNode: node,
				guesses: node.guesses+1,
				guessOutcomes: [],
			});
			answerOutcomes.push(...validAnswers);
		}
		console.log(node.guesses+1, guess, guessed(node).join(", "), guessesCache[node.validGuessesRegex].length, new Set(answersCache[node.validAnswersRegex]).size);
		if (new Set(answerOutcomes).size !== new Set(answersCache[node.validAnswersRegex]).size) {
			console.log("answers don't match (previous answers, new outcomes set)", guess, new Set(answersCache[node.validAnswersRegex]).size, new Set(answerOutcomes).size, new Set(answersCache[node.validAnswersRegex]), new Set(answerOutcomes.sort()));
			let iterator = node;
			while (iterator.guesses !==0) {
				let {guessOutcomes, parentNode, ...loggable} = iterator;
				console.log(loggable);
				console.log(constructAnswersRegex(iterator));
				console.log(constructGuessesRegex(iterator));
				iterator = iterator.parentNode;
			}
			exit(2);
		}
		if (node.guesses ===i && i!==5)
			break;
	}
	queue.push(...node.guessOutcomes);
}

while (queue.length > 0) {
	let node = queue.pop();
	processNode(node);
}

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

