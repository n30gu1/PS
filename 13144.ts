import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

let n: number;
let arr: number[];

rl.on("line", (line) => {
  if (!n) {
    n = parseInt(line);
  } else {
    arr = line.split(" ").map(Number);
    rl.close();
  }
}).on("close", () => {
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    const cur: number[] = [arr[i]];
    for (let j = i + 1; j < n; j++) {
      if (cur.indexOf(arr[j]) !== -1) {
        break;
      }
      cur.push(arr[j]);
    }
    cnt += cur.length;
  }
  console.log(cnt);
});