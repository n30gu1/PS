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

function find(parent: number[], x: number): number {
  if (parent[x] !== x) {
      parent[x] = find(parent, parent[x]);
  }
  return parent[x];
}

function union(parent: number[], rank: number[], x: number, y: number): void {
  const rootX = find(parent, x);
  const rootY = find(parent, y);

  if (rootX !== rootY) {
      if (rank[rootX] > rank[rootY]) {
          parent[rootY] = rootX;
      } else if (rank[rootX] < rank[rootY]) {
          parent[rootX] = rootY;
      } else {
          parent[rootY] = rootX;
          rank[rootX]++;
      }
  }
}

function kruskal(n: number, edges: Edge[]): number {
  edges.sort((a, b) => a.cost - b.cost);
  const parent: number[] = Array.from({ length: n + 1 }, (_, index) => index);
  const rank: number[] = new Array(n + 1).fill(0);

  let mstCost = 0;
  let maxEdgeInMST = 0;
  let edgeCount = 0;

  for (const { from, to, cost } of edges) {
      if (find(parent, from) !== find(parent, to)) {
          union(parent, rank, from, to);
          mstCost += cost;
          maxEdgeInMST = cost;
          edgeCount++;

          if (edgeCount === n - 1) {
              break;
          }
      }
  }

  return mstCost - maxEdgeInMST;
}

rl.on("line", (line) => {

}).on("close", () => {
});

console.log(kruskal(n, edges)); // Outputs the minimum cost
