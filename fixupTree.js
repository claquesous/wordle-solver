import fs from 'fs';

import { constructAnswersRegex, regexToHash } from './regex.js';
import { getMatchingAnswers } from './cache.js';
import { processNode, nodeExists } from './node.js';
import { answers } from './answers.js';

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
      const regex = constructAnswersRegex(node, answers);

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
  let totalCount=0;
  for await (const file of dir) {
    const nodesArray = JSON.parse(fs.readFileSync(`./solve/${file.name}`));
    let keys = Object.keys(nodesArray);
    keys.forEach(async (key) => {
      let node = nodesArray[key];
      const answers = await getMatchingAnswers(node.validAnswersRegex);

      if (!node.guessOutcomes){
        await processNode(key, queue);
        return;
      }
      let guesses = Object.keys(node.guessOutcomes);
      if (guesses.length < answers.length) {
        console.log("Unprocessed", key);
        await processNode(key, queue);
      }
      else {
        let valid = true;
        for (let i=0; i<guesses.length && valid; i++) {
          let outcomes = node.guessOutcomes[guesses[i]];
          for (let j=0; j<outcomes.length; j++) {
            valid = nodeExists(outcomes[j]);
            if (!valid) {
              console.log("Non-existent", key);
              await processNode(key);
              break;
            }
          }
        }
      }
    });
    while(queue.length > 0) {
      await processNode(queue.shift(), queue);
    }
    console.log("Through:", ++totalCount);
  }
};

(async () => {
  //await fixupRegex();
  await validateTree();
})();

