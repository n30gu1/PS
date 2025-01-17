import { readFileSync } from "fs";

const input = readFileSync('/dev/stdin').toString().split('\n');

const floydWarshall = (n: number, m: number, items: number[], edges: [number, number, number][], dist: number[][]): number => {
  let cases: number[] = [];

  for (let i = 1; i <= n; i++) {
    dist[i][i] = 0;
  }

  for (const edge of edges) {
    const [u, v, w] = edge;
    dist[u][v] = Math.min(dist[u][v], w);
    dist[v][u] = Math.min(dist[v][u], w);
  }

  for (let k = 1; k <= n; k++) {
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= n; j++) {
        if (dist[i][k] < Infinity && dist[k][j] < Infinity)
          dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
      }
    }
  }

  for (let i = 1; i <= n; i++) {
    cases.push(0);
    cases[i - 1] = dist[i]
      .reduce((acc, cur, idx) =>
        (cur <= m) ? acc + items[idx - 1] : acc, 0);
  }

  return cases.reduce((acc, cur) => Math.max(acc, cur), 0);
}

const [n, m, r] = input[0].split(' ').map(Number);
const items = input[1].split(' ').map(Number);
const edges: [number, number, number][] = input.slice(2, 2 + r)
  .map(v => {
    const val = v.split(' ').map(Number);
    return [val[0], val[1], val[2]];
  });

console.log(floydWarshall(n, m, items, edges, Array.from(Array(n + 1), () => Array(n + 1).fill(Infinity))));