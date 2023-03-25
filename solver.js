const fs = require("fs");

let guesses = fs.readFileSync("words.txt", "utf8").split("\n");
guesses.pop();
let answers = fs.readFileSync("answers.txt", "utf8").split("\n");
answers.pop();

let queue = [];

let answersCache = {};
let guessesCache = {};

let root = {
	validGuesses: guesses,
	validAnswers: answers,
	known: [],
	misplaced: [[],[],[],[],[]],
	missing: [],
	parentNode: null,
	guesses: 0,
	guessOutcomes: [],
};

queue.push(root);

let constructGuessesRegex = function({known, misplaced}) {
	let knownArray = [".",".",".",".","."];
	let regex;
	for (let i=0; i<known.length; i++) {
		if (!!known[i])
			knownArray[i] = known[i];
	}
	regex = knownArray.join("");
	for (let i=0; i<misplaced.length; i++) {
		for (let j=0; j<misplaced[i].length; j++) {
			regex = regex.concat(`(?<=${misplaced[i][j]}.*)`);
		}
	}
	return regex;
};

let constructAnswersRegex = function({known, misplaced, missing}) {
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
	for (let i=0; i<misplaced.length; i++) {
		for (let j=0; j<misplaced[i].length; j++) {
			regex = regex.concat(`(?<=${misplaced[i][j]}.*)`);
		}
	}
	if (missing.length > 0 ) {
		regex = regex.concat(`(?<!([${[...new Set(missing.sort())].join("")}].*))`);
	}
	return regex;
};

let validOutcome = function({known, misplaced, missing}) {
	const knownCount = known.filter((x) => {return !!x}).length;
	const minimumMisplacedCount = new Set(misplaced.reduce((arr,x) => {return arr.concat(x)}, [])).size;
	if (minimumMisplacedCount + knownCount > 5) {
//		console.log("too many", known, misplaced);
		return false;
	}
	for (let i=0; i<5; i++) {
		if (!!known[i] && misplaced[i].includes(known[i])) {
//			console.log("same character right position and wrong", i, known, misplaced);
			return false;
		}
	}
	return true;
}

let enumerateOutcomes = function(word, {known, misplaced, missing}) {
	let outcomes = [];
	for (let i=0; i<243; i++) {
		let valid = true;
		let node = {
			known: [...known],
			misplaced: misplaced.map((x) => { return [...x]}),
			missing: [...missing],
		};
		for (let j=0; j<5; j++) {
			let outcome = (Math.floor(i/(3**j)))%3;
			let letter = word.charAt(j);
			switch (outcome) {
				case 0:
					node.known[j] = letter;
					node.misplaced[j] = [];
					break;
				case 1:
					node.misplaced[j].push(letter);
					break;
				case 2:
					node.missing.push(letter);
					break;
			}
		}
		node.missing = [...new Set(node.missing)];
		outcomes.push(node);
	}
	return outcomes.filter(validOutcome);
}

let processNode = function(node) {
	if (node.guesses === 6 || node.validAnswers.length === 0) {
		return;
	}
	for (let i=0; i<node.validGuesses.length/1000; i++) {
		let guess = node.validGuesses[i];
		if (node.guesses===0)
			guess = "chump";
		console.log(node.guesses, guess);
		let outcomes = enumerateOutcomes(guess, node);
		let answerOutcomes = [];
		for (let j=0; j<outcomes.length; j++) {
			let answerRegex = constructAnswersRegex(outcomes[j]);
			let guessRegex = constructGuessesRegex(outcomes[j]);
//			console.log(outcomes[j], answerRegex, guessRegex);
			let validGuesses = guessesCache[guessRegex] ||= guesses.filter((w) => { return !!w.match(new RegExp(guessRegex))});
			if (validGuesses.length <1)
				continue;
	//		console.log(answerRegex, guessRegex);
			let validAnswers = answersCache[answerRegex] ||= answers.filter((w) => { return !!w.match(new RegExp(answerRegex))});
			node.guessOutcomes.push({
				guess,
				validGuesses,
				validAnswers,
				...outcomes[j],
				parentNode: node,
				guesses: node.guesses+1,
				guessOutcomes: [],
			});
			answerOutcomes.push(...validAnswers);
		}
		if (new Set(answerOutcomes).size !== new Set(node.validAnswers).size && node.guesses === 5) {
			console.log("answers don't match", new Set(node.validAnswers).size, new Set(answerOutcomes).size, new Set(answerOutcomes).has(guess), new Set(node.validAnswers), new Set(answerOutcomes.sort()));
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
		if (node.guesses ===0)
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

/*
let tritree = [{},{},{},{},{}];

for (let i=0; i<5; i++){
    words.forEach(w => {
        key = w.substring(0,i) + "_" + w.substring(i+1);
        if (!tritree[i][key]) tritree[i][key] = [];
        tritree[i][key] = tritree[i][key].concat(w[i]);
    })
    Object.keys(tritree[i]).forEach(key => {if(tritree[i][key].length > 3) console.log(key,tritree[i][key])});
}


console.log(tritree);
*/
