import { createInterface } from 'readline';

const minLampHeight = (N: number, M: number, positions: number[]): number => {
  let left = 0;
  let right = N;
  let result = N; 

  while (left <= right) {
    const mid = Math.floor((left + right) / 2); 

    if (isIlluminated(N, M, positions, mid)) {
      result = mid; 
      right = mid - 1;
    } else {
      left = mid + 1; 
    }
  }

  return result;
}

const isIlluminated = (N: number, M: number, positions: number[], height: number): boolean => {
  let currentPosition = 0;
  let lampIndex = 0;

  while (currentPosition <= N) {
    if (lampIndex < M && positions[lampIndex] <= currentPosition + height) {
      currentPosition = positions[lampIndex++] + height;
    } else if (currentPosition < N) {
      return false;
    } else {
      return true;
    }
  }

  return true; 
}

let N: number;
let M: number;
let positions: number[];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (line) => {
    if (N === undefined) {
        N = parseInt(line);
    } else if (M === undefined) {
        M = parseInt(line);
    } else {
        positions = line.split(' ').map(Number);
    }
}).on('close', () => {
    const result = minLampHeight(N, M, positions);
    console.log(result);
    process.exit(0);
});
