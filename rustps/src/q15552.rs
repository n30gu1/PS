use std::io::{self, BufRead};

pub fn main() {
    let n = io::stdin()
                .lock()
                .lines()
                .next()
                .unwrap()
                .unwrap()
                .parse::<i32>()
                .unwrap();


    for _ in 0..n {
        let pair = io::stdin()
                    .lock()
                    .lines()
                    .next()
                    .unwrap()
                    .unwrap()
                    .split_whitespace()
                    .map(|s| s.parse::<i32>().unwrap())
                    .collect::<Vec<i32>>();

        println!("{}", pair[0] + pair[1]);
    }
}