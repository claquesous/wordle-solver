const { readFileSync } = require("fs");

let answers = readFileSync("answers.txt", "utf8").split("\n");
answers.pop();

module.exports = { answers };
