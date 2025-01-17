import { readFileSync } from "fs";

const input = readFileSync('/dev/stdin').toString().split('\n');

const [n, m] = input[0].split(' ').map(Number);
let dist = Array.from({ length: n }, () => Array(n).fill(false));

for (let i = 0; i < n; i++) {
  dist[i][i] = false;
}

for (let i = 1; i <= m; i++) {
  const [a, b] = input[i].split(' ').map(Number);
  dist[a - 1][b - 1] = true;
}

const floydWarshall = () => {
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] === true && dist[k][j] === true) {
          dist[i][j] = true;
        }
      }
    }
  }
}

floydWarshall();

let ans = 0;

for (let i = 0; i < n; i++) {
  let cnt = 0;
  for (let j = 0; j < n; j++) {
    if (dist[i][j] === true || dist[j][i]) { cnt++; }
  }

  if (cnt === n - 1) { ans++; }
}

console.log(ans);