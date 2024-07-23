import { createInterface } from "readline";

const rl = createInterface(process.stdin);

let lenPrimeFact: number[] = [...Array(100001).map(_ => 0)];
let prime: boolean[] = [...Array(100001).map(_ => true)];

let a: number, b: number;

rl.on('line', i => {
    [a, b] = i.split(" ").map(e => parseInt(e));
    rl.close();
}).on('close', () => {
    let cnt = 0;
    // 316 ~= √(100000)
    prime[0] = false; prime[1] = false;
    for (let i = 2; i <= 316; i++) {
        if (!prime[i]) continue;
        for (let j = i * 2; j <= 100000; j += i) {
            if (!prime[j]) continue;
            lenPrimeFact[j] = lenPrimeFact[j/i] + 1;
            prime[j] = false;
        }

        if (prime[i]) lenPrimeFact[i] = 1;
    }
    for (let i = a; a <= b; i++) {
        if (prime[lenPrimeFact[i]]) {
            cnt++;
        }
    }
    console.log(cnt);
});