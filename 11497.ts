import * as fs from 'fs';

const input = fs.readFileSync("/dev/stdin").toString().split("\n");

for (let i = 1; i < input.length - 1; i += 2) {
  const n = parseInt(input[i]);
  const raw = input[i + 1].split(" ").map(e => parseInt(e)).sort().reverse();
  let   result: number[] = [];
  let   dif = 0;

  for (let j = 0; j < n - 1; j += 2) result.push(raw[j]);
  for (let j = 1; j < n; j += 2) result.splice(0, 0, raw[j]);
  result.push(result[0]);

  for (let j = 0; j < n - 1; j++) {
    const difCand = Math.abs(result[j] - result[j + 1]);

    if (difCand > dif) dif = difCand;
  }

  console.log(dif);
}