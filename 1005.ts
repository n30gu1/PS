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

const topologicalSort = (graph: number[][], entDeg: number[]): [number, [number, number][]] => {
  let q: Queue = new Queue();
  let retDeg: Queue = new Queue();
  let maxRetDeg = 0;

  entDeg.forEach((deg, i) => {
    if (deg === 0) {
      q.push(i);
      retDeg.push(0);
    }
  });

  let result: [number, number][] = [];

  while (q.data.length) {
    const x = q.pop();
    const curRetDeg = retDeg.pop();
    if (x === 0) continue;
    result.push([x, curRetDeg]);

    graph[x].forEach((y) => {
      entDeg[y]--;
      if (entDeg[y] === 0) {
        q.push(y);
        retDeg.push(curRetDeg + 1);
        maxRetDeg = Math.max(maxRetDeg, curRetDeg + 1);
      }
    });
  }

  return [maxRetDeg, result];
};

let t: number | undefined;
let n: number | undefined;
let k: number | undefined;
let prices: number[] | undefined;
let graph: number[][] | undefined;
let entDeg: number[] | undefined;
let cnt = 0;

rl.on("line", (line) => {
  if (!t) t = Number(line);
  else if (!n) {
    [n, k] = line.split(" ").map(Number);
    graph = Array.from({ length: n + 1 }, () => []);
    entDeg = new Array(n + 1).fill(0);
  } else if (!prices) prices = line.split(" ").map(Number);
  else if (cnt < k!) {
    const [a, b] = line.split(" ").map(Number);
    graph![a].push(b);
    entDeg![b]++;
    cnt++;
  } else {
    const w = Number(line);
    const topoSortResult = topologicalSort(graph!, entDeg!);
    let result: number[][] = Array.from({ length: topoSortResult[0] + 1 }, () => []);
    topoSortResult[1].forEach(e => {
      result[e[1]].push(prices![e[0] - 1]);
    });
    console.log(
      result
        .filter(e => e.length > 0)
        .map(e => e.sort((a, b) => b - a))
        .flatMap(e => e[0])
        .slice(w)
        .reduce((acc, cur) => acc + cur, 0)
    );

    console.log(
      result
        .filter(e => e.length > 0)
        .map(e => e.sort((a, b) => b - a))
        .flatMap(e => e[0])
        .splice(0, w)
    );

    t--;
    if (t === 0) rl.close();
    n = k = undefined;
    prices = graph = entDeg = undefined;
    cnt = 0;
  }
});