import { createInterface } from "readline";

const rl = createInterface(process.stdin);

let n: number;
let i = 0;

const table: number[] = (() => { 
    const table = Array(10001).fill(true);
    let ret: number[] = [];
    table[0] = table[1] = false;
    for (let i = 2; i <= 10000; i++) {
        if (table[i]) {
            for (let j = i * 2; j <= 10000; j += i) {
                table[j] = false;
            }
        }
    }

    for (let i = 2; i <= 10000; i++) {
        if (table[i]) {
            ret.push(i);
        }
    }
    return ret;
})();
    

rl.on("line", (line) => {
    if (!n) n = parseInt(line);
    else if (i < n) {
        const candidates: number[][] = [];
        for (let j = 0; j < table.length; j++) {
            for (let k = 0; k < table.length; k++) {
                if (table[j] + table[k] === parseInt(line)) {
                    candidates.push([table[j], table[k]]);
                }
            }
        }

        let final: number[] = [candidates[0][0], candidates[0][1]];
        candidates.forEach((candidate) => {
            if (candidate[1] - candidate[0] < final[1] - final[0]) {
                final[1] = candidate[1];
                final[0] = candidate[0];
            }
        });

        console.log(final[0], final[1]);
        i++;
    } else rl.close();
}).on("close", () => {
    process.exit();
});