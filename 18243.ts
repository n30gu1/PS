import { readFileSync } from "fs";

const input = readFileSync('/dev/stdin').toString().split('\n');

const floydWarshall = (n: number, edges: [number, number][]): boolean => {
  let dist = Array.from(Array(n), () => Array(n).fill(Infinity));

  for (const edge of edges) {
    let [u, v] = edge;
    u--; v--;
    dist[u][v] = 1;
    dist[v][u] = 1;
  }

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] < Infinity && dist[k][j] < Infinity)
          dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (dist[i][j] > 6) {
        return false;
      }
    }
  }

  return true;
}

const [n, k] = input[0].split(' ').map(Number);
const edges: [number, number][] = input.slice(1, 1 + k).map(v => {
  const val = v.split(' ').map(Number);
  return [val[0], val[1]];
});

console.log(floydWarshall(n, edges) ? "Small World!" : "Big World!");