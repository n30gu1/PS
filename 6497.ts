import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

let inputLines: string[] = [];
rl.on('line', (line) => {
  inputLines.push(line.trim());
}).on('close', () => {
  let index = 0;
  while (index < inputLines.length) {
    const line = inputLines[index++];
    if (line === '0 0') break;
    const [m, n] = line.split(' ').map(Number);

    let totalCost = 0;
    const edges: Edge[] = [];

    for (let i = 0; i < n; i++) {
      const [x, y, z] = inputLines[index++].split(' ').map(Number);
      totalCost += z;
      edges.push(new Edge(x, y, z));
    }

    const savedCost = kruskal(m, edges);
    console.log(totalCost - savedCost);
  }
});

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

class UnionFind {
  parent: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, idx) => idx);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;
    this.parent[rootY] = rootX;
    return true;
  }
}

const kruskal = (n: number, edges: Edge[]): number => {
  edges.sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(n);
  let mstCost = 0;

  for (const edge of edges) {
    if (uf.union(edge.u, edge.v)) {
      mstCost += edge.weight;
    }
  }

  return mstCost;
};