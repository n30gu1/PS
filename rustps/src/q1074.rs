use std::io;

fn search(n: i32, r: i32, c: i32) -> i32 {
    if n == 1 { return 0; }

    if r < n / 2 && c < n / 2 {
        return search(n / 2, r, c);
    } else if r < n / 2 && c >= n / 2 {
        return ((n / 2) * (n / 2)) + search(n / 2, r, c - n / 2);
    } else if r >= n / 2 && c < n / 2 {
        return ((n / 2) * (n / 2) * 2) + search(n / 2, r - n / 2, c);
    } else {
        return ((n / 2) * (n / 2) * 3) + search(n / 2, r - n / 2, c - n / 2);
    }
}

pub fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let vi = input.split_whitespace().map(|x| x.parse::<i32>().unwrap()).collect::<Vec<i32>>();

    let n = 2_i32.pow(vi[0] as u32);
    let r = vi[1];
    let c = vi[2];

    println!("{}", search(n, r, c));
}