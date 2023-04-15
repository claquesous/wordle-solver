import crypto from 'crypto';

import { answers } from './answers.js';
import { answersCache } from './cache.js';

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
	let found;
	do {
		found = false;
		let misplacedLetters = [...new Set(misplaced.flat())];
		misplacedLetters.forEach((letter) => {
			const mysteryCount = counts[letter]-(knownCounts[letter] || 0);
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
					else if (index >= 0) {
						misplaced[i].splice(index,1);
					}
				}
			}
		});
	} while (found);
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
		if (filtered.length > 0)
			regex = regex.concat(`(?<!([${[...new Set(filtered.sort())].join("")}].*))`);
	}
	return regex;
};

let getMatchingAnswers = async function(regex, answerList = answers) {
	let matchingAnswers;
	try {
		let cachedAnswers = await answersCache.get(regex);
		matchingAnswers = cachedAnswers.split(",");
		if (matchingAnswers[0] === '')
			matchingAnswers = [];
	} catch (NotFoundError) {
		const re = new RegExp(regex);
		matchingAnswers = answerList.filter(w => !!w.match(re));
		await answersCache.put(regex, matchingAnswers);
	}
	return matchingAnswers;
}

const regexToHash = function(regex) {
	const hash = crypto.createHash('sha1');
	hash.update(regex);
	return hash.digest('hex');
}

export { constructGuessesRegex, constructAnswersRegex, getMatchingAnswers, regexToHash };

