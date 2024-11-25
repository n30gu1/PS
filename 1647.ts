import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

interface Edge {
  from: number;
  to: number;
  cost: number;
}

const find = (parent: number[], x: number): number => {
  if (parent[x] !== x) {
    parent[x] = find(parent, parent[x]);
  }
  return parent[x];
};

const union = (parent: number[], x: number, y: number): void => {
  x = find(parent, x);
  y = find(parent, y);
  if (x < y) parent[y] = x;
  else parent[x] = y;
};

const kruskal = (N: number, edges: Edge[]): number => {
  edges.sort((a, b) => a.cost - b.cost);
  const parent: number[] = Array.from({ length: N + 1 }, (_, index) => index);

  let totalCost = 0;
  let maxCost = 0;

  for (const { from, to, cost } of edges) {
    if (find(parent, from) !== find(parent, to)) {
      union(parent, from, to);
      totalCost += cost;
      maxCost = cost;
    }
  }

  return totalCost - maxCost;
};

let n: number;
let m: number;
let edges: Edge[] = [];

rl.on("line", (line) => {
  if (!n) {
    [n, m] = line.split(" ").map(Number);
  } else if (edges.length < m) {
    const [from, to, cost] = line.split(" ").map(Number);
    edges.push({ from, to, cost });
  }
}).on("close", () => {
  console.log(kruskal(n, edges));
});