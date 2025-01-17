use std::{collections::VecDeque, io::{self, BufRead}};

pub fn main() {
    let (n, k, m) = (|| {
        let input = io::stdin()
                        .lock()
                        .lines()
                        .next()
                        .unwrap()
                        .unwrap()
                        .split_whitespace()
                        .map(|s| s.parse::<i32>().unwrap())
                        .collect::<Vec<i32>>();

        return (input[0], input[1], input[2]);
    })();

    let mut people: VecDeque<i32> = (1..=n).collect();

    for i in 0..n {
        for _ in 0..k - 1 {
            if let Some(front) = people.pop_front() {
                people.push_back(front);
            }
        }
        println!("{}", people.pop_front().unwrap());

        if (i + 1) % m == 0 {
            people = people.iter().rev().copied().collect();
        }
    }
}