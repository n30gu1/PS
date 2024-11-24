import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

class UnionFind {
  parent: number[];

  constructor(n: number) {
    this.parent = new Array(n).fill(-1);
  }

  find(x: number): number {
    if (this.parent[x] === -1) return x;
    return this.parent[x] = this.find(this.parent[x]);
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false; // 이미 같은 집합
    this.parent[rootY] = rootX; // 두 집합 합치기
    return true;
  }
}

class Edge {
  u: number;
  v: number;
  weight: number;

  constructor(u: number, v: number, weight: number) {
    this.u = u;
    this.v = v;
    this.weight = weight;
  }
}

const solution = (V: number, E: number, edges: Edge[]): number => {
  edges.sort((a, b) => a.weight - b.weight);

  const uf = new UnionFind(V + 1) 
  let totalWeight = 0;

  edges.forEach(edge => {
    if (uf.union(edge.u, edge.v)) {
      totalWeight += edge.weight;
    }
  });

  return totalWeight;
}

let V: number | undefined = undefined;
let E: number | undefined = undefined;
let edges: Edge[] = [];

rl.on("line", (line) => {
  if (!V) {
    [V, E] = line.split(" ").map(Number);
  } else if (edges.length < E!) {
    const [u, v, weight] = line.split(" ").map(Number);
    edges.push(new Edge(u, v, weight));
  } else {
    rl.close(); }
}).on("close", () => {
  console.log(solution(V!, E!, edges));
});
