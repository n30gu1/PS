import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const inputLines: string[] = [];
rl.on('line', (line) => {
  inputLines.push(line.trim());
}).on('close', () => {
  const [nStr, mStr] = inputLines[0].split(' ');
  const n = parseInt(nStr);
  const m = parseInt(mStr);

  let totalCost = 0;
  const edges: Edge[] = [];

  for (let i = 1; i <= m; i++) {
    const [aStr, bStr, cStr] = inputLines[i].split(' ');
    const a = parseInt(aStr);
    const b = parseInt(bStr);
    const c = parseInt(cStr);
    totalCost += c;
    edges.push(new Edge(a, b, c));
  }

  const mstCost = kruskal(n, edges);
  if (mstCost === -1) {
    console.log(-1);
  } else {
    console.log(totalCost - mstCost);
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

  constructor(size: number) {
    this.parent = new Array(size + 1);
    for (let i = 1; i <= size; i++) {
      this.parent[i] = i;
    }
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) {
      return false;
    }
    this.parent[py] = px;
    return true;
  }
}

const kruskal = (n: number, edges: Edge[]): number => {
  edges.sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(n);
  let mstCost = 0;
  let edgeCount = 0;

  for (const edge of edges) {
    if (uf.union(edge.u, edge.v)) {
      mstCost += edge.weight;
      edgeCount++;
    }
  }

  if (edgeCount !== n - 1) return -1;
  return mstCost;
};