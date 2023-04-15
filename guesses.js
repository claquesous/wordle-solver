import { readFileSync } from "fs";

let guesses = readFileSync("words.txt", "utf8").split("\n");
guesses.pop();

export { guesses };

