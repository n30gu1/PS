import { readFileSync } from "fs";

const input = readFileSync('/dev/stdin').toString().split('\n');

let t = Number(input[0]);
while (t--) {
  const [n, m, w] = input[1].split(' ').map(Number);
  // Road
  for (let i = 0; i < m; i++) {
    const [s, e, t] = input[i + 2].split(' ').map(Number);
  }

  // Wormhole
  for (let i = 0; i < w; i++) {
    const [s, e, t] = input[i + 2 + m].split(' ').map(Number);
  }
}