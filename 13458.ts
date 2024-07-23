import { createInterface } from "readline";

const rl = createInterface(process.stdin);

let n: number;
let a_i: number[] = [];
let b: number, c: number;

const validators = (n: number, c: number, count: number): number => {
    if (n > 0) {
        return validators(n - Math.floor(n / c), c, count + Math.floor(n / c));
    }

    return count;
}

rl.on("line", (line) => {
    if (n === null || n === undefined) {
        n = parseInt(line);
    } else if (a_i.length === 0) {
        a_i = line.split(" ").map((v) => parseInt(v));
    } else {
        [b, c] = line.split(" ").map((v) => parseInt(v));
        rl.close();
    }
}).on("close", () => {
    let result = 0;

    for (let i = 0; i < n; i++) {
        result += validators(a_i[i] - b, c, 1);
    }

    console.log(result);
    process.exit();
});