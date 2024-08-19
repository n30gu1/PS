use std::{cmp::Ordering, io::{self, BufWriter, Write}};

macro_rules! print_fast {
    ($($arg:tt)*) => {
        let mut writer = BufWriter::new(io::stdout());
        writer.write(format!($($arg)*).as_bytes()).unwrap();
        writer.flush().unwrap();
    }
}

fn bin_search(arr: &[i32], target: i32) -> bool {
    let mut left = 0;
    let mut right = arr.len() - 1;

    while left <= right {
        let mid = left + (right - left) / 2;
        match arr[mid].cmp(&target) {
            Ordering::Equal => return true,
            Ordering::Less => left = mid + 1,
            Ordering::Greater => {
                if mid == 0 {
                    return false;
                }
                right = mid - 1;
            },
        }
    }
    false
}


pub fn main() {
    let _ = io::stdin().lines().next();

    let mut cards = io::stdin().lines().next().unwrap().unwrap()
                                .split_whitespace()
                                .map(|s| s.parse::<i32>().unwrap())
                                .collect::<Vec<i32>>();

    cards.sort();

    let _ = io::stdin().lines().next();

    let validation = io::stdin().lines().next().unwrap().unwrap()
                                .split_whitespace()
                                .map(|s| s.parse::<i32>().unwrap())
                                .collect::<Vec<i32>>();

    for v in validation {
        if bin_search(&cards, v) { print_fast!("1 "); } else { print_fast!("0 "); }
    }
}
