import { createInterface } from "readline";

const rl = createInterface(process.stdin);
let n: number;
let cnt = 0;

rl.on('line', i => {
    if (n === null || n === undefined) {
        n = parseInt(i);
    } else {
        i.trim().split(" ").map(e => parseInt(e)).forEach(e => {
            if (1 < e && e < 4) { 
                cnt++; 
            } else if (1 < e) {
                let flag = true;
                for (let k = 2; k <= Math.sqrt(e); k++) {
                    if (e % k === 0) {
                        flag = false;
                        break;
                    }
                }

                if (flag) cnt++;
            }
        });
        rl.close();
    }
}).on('close', () => {
    console.log(cnt);
})