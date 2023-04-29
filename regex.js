import crypto from 'crypto';

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

let constructAnswersRegex = function({known, misplaced, missing, counts}, answerList) {
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
	for (const knownLetter of Object.keys(knownCounts)) {
		if (knownCounts[knownLetter]===counts[knownLetter] && missing.includes(knownLetter)) {
			missing.splice(missing.indexOf(knownLetter),1);
			for (let i=0; i<5; i++) {
				if (!known[i] && !misplaced[i].includes(knownLetter)) {
					misplaced[i].push(knownLetter);
					misplaced[i] = [...new Set(misplaced[i])];
				}
			}
		}
	}
	let found;
	do {
		found = false;
		let misplacedLetters = [...new Set(misplaced.flat())];
		for (const letter of misplacedLetters) {
			const mysteryCount = counts[letter]-(knownCounts[letter] || 0);
			if (mysteryCount === 0)
				continue;
			let options = 5;
			for (let i=0; i<5; i++) {
				if (!!known[i] || misplaced[i].includes(letter))
					options--;
			}
			if (mysteryCount === options) {
				found = true;
				for (let i=0; i<5; i++) {
					let index = misplaced[i].indexOf(letter);
					if (!known[i] && index < 0) {
						knownArray[i] = known[i] = letter;
						knownCounts[known[i]] = (knownCounts[known[i]] || 0) + 1;
						knownCount++;
					}
				}
			}
		}
	} while (found);
	for (let i=0; i<5; i++) {
		let mysteryLetters = misplaced[i].sort().filter((letter) => {
			const testKnown = [...knownArray];
			testKnown[i] = `[^${letter}]`;
			const beforeAnswers = applyRegex(knownArray.join(""), answerList);
			const afterAnswers = applyRegex(testKnown.join(""), beforeAnswers);
			if (afterAnswers.length === beforeAnswers.length)
				return false;
			return !missing.includes(letter) || knownCounts[letter] !== counts[letter];
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
			const beforeAnswers = applyRegex(regex, answerList);
			const afterAnswers = applyRegex(regex.concat(`(?<=([^${letter}].*){${5-counts[letter]}})`), beforeAnswers);
			if (afterAnswers.length !== beforeAnswers.length)
				regex = regex.concat(`(?<=([^${letter}].*){${5-counts[letter]}})`);
		}
	});
	if (missing.length > 0 && totalCount <5) {
		const beforeAnswers = applyRegex(regex, answerList);
		let filtered = missing.filter((x) => {
			if (totalCount > 1) {
				const afterAnswers = applyRegex(regex.concat(`(?<!([${x}].*))`), beforeAnswers);
				if (afterAnswers.length === beforeAnswers.length)
					return false;
			}
			return !counts[x];
		});
		if (filtered.length > 0)
			regex = regex.concat(`(?<!([${[...new Set(filtered.sort())].join("")}].*))`);
	}
	return regex;
};

let applyRegex = function(regex, answerList) {
	const re = new RegExp(regex);
	return answerList.filter(w => !!w.match(re));
}

const regexToHash = function(regex) {
	const hash = crypto.createHash('sha1');
	hash.update(regex);
	return hash.digest('hex');
}

export { constructGuessesRegex, constructAnswersRegex, regexToHash, applyRegex };

