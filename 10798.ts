import * as fs from "fs";

const input = fs.readFileSync("/dev/stdin").toString().split("\n").map(e => e.split(""));
const maxWidth = (() => {
  let ret = 0;
  input.forEach(e => {
    if (ret < e.length) ret = e.length;
  })

  return ret;
})();

const result: string[] = [];

for (let i = 0; i < maxWidth; i++) {
  for (let j = 0; j < 5; j++) {
    result.push(input[j][i]);
  }
}

console.log(result.join(""));