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

module.exports = { constructGuessesRegex, constructAnswersRegex };
