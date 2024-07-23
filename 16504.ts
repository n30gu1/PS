import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  // output: process.stdout
});

let sum = 0;
let cnt = 0;

rl.on('line', s => {
  if (cnt > 0) {
    s.trim().split(' ').map(e => parseInt(e)).forEach(e => {sum += e});
  }
}).on('close', () => {
  console.log(sum);
});