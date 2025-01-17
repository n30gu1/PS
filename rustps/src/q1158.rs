use std::io::{self, BufRead};
use std::collections::VecDeque;

pub fn main() {
    let input: Vec<i32> = io::stdin()
                                .lock()
                                .lines()
                                .next()
                                .unwrap()
                                .unwrap()
                                .trim()
                                .split_whitespace()
                                .map(|s| s.parse::<i32>().unwrap())
                                .collect();

    let (n, k) = (input[0], input[1]);

    let mut people: VecDeque<i32> = (1..=n).collect();

    print!("<");
    for _ in 0..n {
        for _ in 0..k - 1 {
            if let Some(front) = people.pop_front() {
                people.push_back(front);
            }
        }

        print!("{}", people.pop_front().unwrap());
        if people.len() > 0 {
            print!(", ");
        }
    }

    println!(">");
}