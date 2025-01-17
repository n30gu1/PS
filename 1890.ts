import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const solve = (board: Array<Array<number>>, cnt: number): number => {
  const stride = board[0][0];
  if (stride === 0) {
    return cnt + 1;
  } else if (stride >= board.length) {
    return solve(board.map((a) => a.splice(stride)), cnt);
  } else if (stride >= board[0].length) {
    return solve(board.splice(stride), cnt);
  }
  return solve(board.splice(stride), cnt) + solve(board.map((a) => a.splice(stride)), cnt);
}

let n: number;
let board: Array<Array<number>> = [];

rl.on("line", (l) => {
  if (n === undefined) {
    n = parseInt(l);
  } else {
    const line = l.split(' ').map(Number);
    board.push(line);
  }
}).on("close", () => {
  console.log(solve(board, 0));
});