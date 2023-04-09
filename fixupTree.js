const fs = require('fs');

const { constructAnswersRegex, regexToHash } = require('./regex');
const { processNode, nodeExists } = require('./node');

if (!fs.existsSync('./solve')) {
	console.log("No solve directory");
	process.exit();
}

let fixupRegex = async function() {
	const dir = fs.opendirSync("./solve");
	let mismatchCount = 0;
	let totalCount = 0;
	for await (const file of dir) {
		totalCount++;

		const nodesArray = JSON.parse(fs.readFileSync(`./solve/${file.name}`));

		let keys = Object.keys(nodesArray);

		for (let i=0; i<keys.length; i++) {
			let key = keys[i];
			const node = nodesArray[key];
			const regex = constructAnswersRegex(node);

			if (regex !== node.validAnswersRegex) {
				const hash = regexToHash(regex);
				console.log("mismatch", hash, key, regex, node.validAnswersRegex);
				mismatchCount++;

				delete nodesArray[key];
				if (Object.keys(nodesArray).length === 0) {
					console.log("delete empty file", file.name, mismatchCount, totalCount);
					fs.unlinkSync(`./solve/${file.name}`, console.log);
				}
				else {
					console.log("update file", file.name, mismatchCount, totalCount);
					const string = JSON.stringify(nodesArray);
				        fs.writeFileSync(`./solve/${file.name}`, string, "utf8");
				}
			}
		}
	}

	console.log(mismatchCount, "out of", totalCount);
};

let validateTree = async function() {
	const dir = fs.opendirSync("./solve");
	let queue = [];
	for await (const file of dir) {
		console.log("Found file:", file.name, mismatchCount, "out of", totalCount);
		totalCount++;

		const nodesArray = require(`./solve/${file.name}`);
		let keys = Object.keys(nodesArray);
		keys.forEach(key => {
			let node = nodesArray[key];
			let guesses = Object.keys(node.guessOutcomes);
			if (guesses.length === 0) {
				processNode(key, queue);
			}
			else {
				let valid = true;
				for (let i=0; i<guesses.length && valid; i++) {
					let outcomes = node.guessOutcomes[guesses[i]];
					for (let j=0; j<outcomes.length; j++) {
						valid = nodeExists(outcomes[j]);
						if (!valid) {
							processNode(key);
							break;
						}
					}
				}
			}
		});
		while(queue.length > 0) {
			await processNode(queue.shift(), queue);
		}
	}
};

(async () => {
	await fixupRegex();
	await validateTree();
})();

