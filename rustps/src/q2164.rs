use std::io::{self, BufRead};
use std::collections::VecDeque;

pub fn main() {
    let n: usize = io::stdin().lock().lines().next().unwrap().unwrap().trim().parse().unwrap();
    
    let mut cards: VecDeque<usize> = (1..=n).collect();

    while cards.len() > 1 {
        cards.pop_front();
        if let Some(card) = cards.pop_front() {
            cards.push_back(card);
        }
    }

    println!("{}", cards[0]);
}