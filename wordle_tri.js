import fs from "fs";

let words = fs.readFileSync("answers.txt", "utf8").split("\n");
words.pop();

let tritree = [{},{},{},{},{}];

for (let i=0; i<5; i++){
    words.forEach(w => {
        let key = w.substring(0,i) + "_" + w.substring(i+1);
        if (!tritree[i][key]) tritree[i][key] = [];
        tritree[i][key] = tritree[i][key].concat(w[i]);
    })
    Object.keys(tritree[i]).forEach(key => {if(tritree[i][key].length > 3) console.log(key,tritree[i][key])});
}

console.log(tritree);

