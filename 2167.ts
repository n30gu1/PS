import { readFileSync } from "fs";

const input = readFileSync("/dev/stdin").toString().split("\n");
const [height, width] = input[0].split(" ").map(e => parseInt(e));

let matrix: number[][] = [];

for (let i = 1; i <= height; i++) {
  let l: number[] = [];
  matrix.push(input[i].split(" ").map(e => parseInt(e)));
}

for (let k = 0; k < parseInt(input[1 + height]); k++) {
  let [i, j, x, y] = input[height + 2 + k].split(" ").map(e => parseInt(e));
  let sum = 0

  for (let l = i - 1; l < x; l++)
    for (let m = j - 1; m < y; m++)
      sum += matrix[l][m];

  console.log(sum);
}