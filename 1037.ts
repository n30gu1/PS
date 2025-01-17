import { createInterface } from "readline";

const rl = createInterface(process.stdin);
let n: number;
let rn: number[];

rl.on('line', i => {
    if (n === null || n === undefined) {
        n = parseInt(i);
    } else {
        rn = i.split(" ").map(e => parseInt(e)).sort((a, b) => a - b);
        rl.close();
    }
}).on('close', () => {
    console.log(rn[0] * rn[n-1]);
})