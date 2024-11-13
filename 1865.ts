import { readFileSync } from "fs";

const input = readFileSync('/dev/stdin').toString().split('\n');

const bellmanFord = (source: number, n: number, edges: [number, number, number][], dist: number[]): boolean => {
  dist[source] = 0;

  for (let i = 0; i < n - 1; i++) {
    let updated = false;
    for (const edge of edges) {
      const [u, v, w] = edge;

      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    if (!updated) break;
  }

  for (const edge of edges) {
    const [u, v, w] = edge;

    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      return true;
    }
  }

  return false;
};

let index = 0;
let t = Number(input[index++]);

while (t--) {
  const [n, m, w] = input[index++].split(' ').map(Number);
  let edges: [number, number, number][] = [];

  // Road
  for (let i = 0; i < m; i++) {
    const [s, e, time] = input[index++].split(' ').map(Number);
    edges.push([s, e, time]);
    edges.push([e, s, time]);
  }

  // Wormhole
  for (let i = 0; i < w; i++) {
    const [s, e, time] = input[index++].split(' ').map(Number);
    edges.push([s, e, -time]);
  }

  let hasNegativeCycle = false;

  for (let i = 1; i <= n; i++) {
    if (bellmanFord(i, n, edges, Array(n + 1).fill(Infinity))) {
      hasNegativeCycle = true;
      break;
    }
  }

  console.log(hasNegativeCycle ? 'YES' : 'NO');
}
