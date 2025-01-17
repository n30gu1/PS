use std::io::{self};
use std::collections::VecDeque;

pub fn main() {
    let mut deque = VecDeque::new();

    let mut inputbuf = String::new();

    io::stdin().read_line(&mut inputbuf).unwrap();

    let n = inputbuf
                .trim()
                .parse::<i32>()
                .unwrap();
    
    inputbuf.clear();
    for _ in 0..n {
        io::stdin().read_line(&mut inputbuf).unwrap();

        let command = inputbuf
                .split_whitespace()
                .collect::<Vec<&str>>();

        match command[0] {
            "push_front" => deque.push_front(command[1].parse::<i32>().unwrap()),
            "push_back" => deque.push_back(command[1].parse::<i32>().unwrap()),
            "pop_front" => println!("{}", deque.pop_front().unwrap_or(-1)),
            "pop_back" => println!("{}", deque.pop_back().unwrap_or(-1)),
            "size" => println!("{}", deque.len()),
            "empty" => println!("{}", if deque.is_empty() { 1 } else { 0 }),
            "front" => println!("{}", deque.front().unwrap_or(&-1)),
            "back" => println!("{}", deque.back().unwrap_or(&-1)),
            _ => (),
        }

        inputbuf.clear();
    }
}