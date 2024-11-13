import { readFileSync } from "fs";

const input = readFileSync('/dev/stdin').toString().split('\n');
let currentIndex = 1;

const floydWarshall = (n: number, dist: number[][]) => {
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] < Infinity && dist[k][j] < Infinity) {
          dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
        }
      }
    }
  }
}

const [n, m, r] = input[0].split(' ').map(Number);
