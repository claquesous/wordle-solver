import { readFileSync } from "fs";

let answers = readFileSync("answers.txt", "utf8").split("\n");
answers.pop();

export { answers };

