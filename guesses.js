const { readFileSync } = require("fs");

let guesses = readFileSync("words.txt", "utf8").split("\n");
guesses.pop();

module.exports = { guesses };
