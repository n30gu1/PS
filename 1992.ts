import { createInterface } from "readline";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

let buf: number[][] = [];

let compressed: any[] = [];

const validate = (px: Array<Array<number>>, resArray: any, pos: number) => {
    let x: number = px[0][0];
    let flag = true;
    px.forEach(e => {
        e.forEach(f => {
            (f === x) ? null : (flag = false);
        });
    });

    if (flag) {
        resArray.splice(pos, 0, x);
    } else {
        resArray.splice(pos, 0, []);
        validate( px.slice(0, px.length / 2)
            .map(e => e.slice(0, e.length / 2)), resArray[pos], 0 );
        validate( px.slice(0, px.length / 2)
            .map(e => e.slice(e.length / 2)), resArray[pos], 1 );
        validate( px.slice(px.length / 2)
            .map(e => e.slice(0, e.length / 2)), resArray[pos], 2 );
        validate( px.slice(px.length / 2)
            .map(e => e.slice(e.length / 2)), resArray[pos], 3 );
    }
}

let result = "";

const arrLog = (arr: any[]) => { arr.forEach(e => {
    if (e instanceof Array) {
    result += "(";
        arrLog(e);
    result += ")";
    } else {
        result += `${e}`;
    }
}); }

let n: number;
let cnt = 0;
rl.on("line", (line) => {
    if (n === undefined || n === null) n = parseInt(line);
    else if (cnt < n) {
        buf.push( line.split("").map(e => parseInt(e)) ); cnt++;
    }
    else rl.close();
}).on("close", () => {
    validate(buf, compressed, 0);
    result += "(";
    compressed.forEach(e => {
        arrLog(e);
    });
    result += ")";

    console.log(result);
});
