import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

let c: number;

const INSTRUCTIONS_PER_SEC = 10 ** 8;

rl.on("line", (line) => {
  if (!c) c = parseInt(line); 
  else if (c === 0) rl.close();
  else {
    let [tc, ns, ts, ls] = line.split(" ");
    let [n, t, l] = [parseInt(ns), parseInt(ts), parseInt(ls)];
    let tle = false;

    switch (tc) {
      case "O(N)":
        tle = n * t > INSTRUCTIONS_PER_SEC * l;
        break;
      case "O(N^2)":
        tle = n ** 2 * t > INSTRUCTIONS_PER_SEC * l;
        break;
      case "O(N^3)":
        tle = n ** 3 * t > INSTRUCTIONS_PER_SEC * l;
        break;
      case "O(2^N)":
        tle = 2 ** n * t > INSTRUCTIONS_PER_SEC * l;
        break;
      case "O(N!)":
        tle = factorial(n) * t > INSTRUCTIONS_PER_SEC * l;
        break;
      default:
        break;
    }

    console.log(tle ? "TLE!" : "May Pass.");
  }
}).on("close", () => {
  process.exit(0);
});

const factorial = (num: number) => {
  if (num === 0 || num === 1)
    return 1;
  for (let i = num - 1; i >= 1; i--) {
    num *= i;
  }
  return num;
}