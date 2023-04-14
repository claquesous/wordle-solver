let validOutcome = function({known, misplaced, counts}) {
	const knownCount = known.filter((x) => {return !!x}).length;
	const minimumMisplacedCount = new Set(misplaced.reduce((arr,x) => {return arr.concat(x)}, [])).size;
	if (Object.keys(counts).reduce((sum,letter) => {return sum+counts[letter];}, 0)>5 ) {
		if (process.env.DEBUG) console.log("too many", known, misplaced);
		return false;
	}
	for (let i=0; i<5; i++) {
		if (!!known[i] && misplaced[i].includes(known[i])) {
			if (process.env.DEBUG) console.log("same character right position and wrong", i, known, misplaced);
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
					node.counts[letter] = (node.counts[letter] || 0) +1;
					break;
				case 1:
					node.misplaced[j].push(letter);
					node.counts[letter] = (node.counts[letter] || 0) +1;
					break;
				case 2:
					node.missing.push(letter);
					if (!!known[j]) {
						if (process.env.DEBUG) console.log("invalid missing", j, known[j]);
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
				if (process.env.DEBUG) console.log("invalid counts", count, counts[letter]);
			}
		});
		Object.keys(node.counts).forEach((letter) => {
			if ((!counts[letter] || (node.counts[letter] > counts[letter])) && missing.includes(letter)) {
				valid = false;
				if (process.env.DEBUG) console.log("invalid count was missing", letter, node.counts, counts, missing);
			}
		});
		if (valid) {
			for (let j=0; j<5; j++) {
				if (node.known[j] || known[j]) {
					node.known[j] = node.known[j] || known[j];
				}
				else {
					node.misplaced[j] = [...new Set(node.misplaced[j].concat(misplaced[j]).sort())];
				}
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

module.exports = { enumerateOutcomes };

