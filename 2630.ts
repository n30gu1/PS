import { createInterface } from "readline";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

let buf: number[][] = [];

let white = 0;
let blue = 0;

const validate = (paper: number[][]) => {
    let x: number = paper[0][0];
    let flag = true;
    paper.forEach(e => {
        e.forEach(f => {
            (f === x) ? null : (flag = false);
        });
    });

    if (flag) {
        x === 0 ? white++ : blue++;
    } else {
        validate( paper.slice(0, paper.length / 2)
            .map(e => e.slice(e.length / 2)));
        validate( paper.slice(paper.length / 2)
            .map(e => e.slice(0, e.length / 2)));
        validate( paper.slice(0, paper.length / 2)
            .map(e => e.slice(0, e.length / 2)));
        validate( paper.slice(paper.length / 2)
            .map(e => e.slice(e.length / 2)));
    }
}

let n: number;
let cnt = 0;
rl.on("line", (line) => {
    if (n === undefined || n === null) n = parseInt(line);
    else if (cnt < n) {
        buf.push( line.split(" ").map(e => parseInt(e)) ); cnt++;
    }
    else rl.close();
}).on("close", () => {
    validate(buf);
    console.log(white);
    console.log(blue);
});
