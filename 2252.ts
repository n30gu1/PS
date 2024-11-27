import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

class Queue {
  data: number[];

  constructor() {
    this.data = [];
  }

  push(x: number) {
    this.data.push(x);
  }

  pop(): number {
    return this.data.shift()!;
  }
}

const topologicalSort = (graph: number[][], entDeg: number[]): number[] => {
  let q: Queue = new Queue();

  entDeg.forEach((deg, i) => {
    if (deg === 0) q.push(i);
  });

  let result: number[] = [];

  while (q.data.length) {
    const x = q.pop();
    if (x === 0) continue;
    result.push(x);

    graph[x].forEach((y) => {
      entDeg[y]--;
      if (entDeg[y] === 0) q.push(y);
    });
  }

  return result;
};


let n: number;
let m: number;

let graph: number[][];
let entDeg: number[];

rl.on("line", (line) => {
  if (!n) {
    [n, m] = line.split(" ").map(Number);
    graph = Array.from({ length: n + 1 }, () => []);
    entDeg = new Array(n + 1).fill(0);
  } else {
    const [a, b] = line.split(" ").map(Number);
    graph[a].push(b);
    entDeg[b]++;
  }
}).on("close", () => {
  const result = topologicalSort(graph, entDeg);
  console.log(result.join(" "));
});