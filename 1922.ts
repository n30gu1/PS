import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

class UnionFind {
  parent: number[];

  constructor(size: number) {
    this.parent = new Array(size).fill(-1);
  }

  find(x: number): number {
    if (this.parent[x] === -1) {
      return x;
    }
    return (this.parent[x] = this.find(this.parent[x]));
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false; // Already in the same set
    }
    this.parent[rootY] = rootX; // Merge sets
    return true;
  }
}

class Edge {
  constructor(public u: number, public v: number, public weight: number) {}
}

const kruskalMST = (V: number, edges: Edge[]): number => {
  edges.sort((a, b) => a.weight - b.weight);

  const uf = new UnionFind(V + 1);
  let totalWeight = 0;

  for (const edge of edges) {
    if (uf.union(edge.u, edge.v)) {
      totalWeight += edge.weight;
    }
  }

  return totalWeight;
};

let V: number;
let E: number;
const edges: Edge[] = [];

rl.on('line', (line) => {
  if (!V) {
    V = Number(line);
  } else if (!E) {
    E = Number(line);
  } else {
    const [u, v, weight] = line.split(' ').map(Number);
    edges.push(new Edge(u, v, weight));
  }

  if (edges.length === E) {
    rl.close();
  }
}).on('close', () => {
  const result = kruskalMST(V, edges);
  console.log(result);
});