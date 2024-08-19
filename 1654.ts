import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

let k: number;
let n: number;
let cables: number[] = [];

rl.on("line", (line) => {
  if (k === undefined) {
    k = parseInt(line.split(" ")[0]);
    n = parseInt(line.split(" ")[1]);
  } else {
    cables.push(parseInt(line));
  }
}).on("close", () => {
  run();
  process.exit(0);
});

const run = () => {
  let rhs = Math.max(...cables);
  let lhs = 1;

  while (lhs <= rhs) {
    const mid = Math.floor((lhs + rhs) / 2);
    const cutCables = cables.reduce((acc, cable) => acc + Math.floor(cable / mid), 0);
    if (cutCables >= n) {
      lhs = mid + 1;
    } else {
      rhs = mid - 1;
    }
  }

  console.log(rhs);
};