use std::{cmp::Ordering, io::{self, BufRead, BufWriter, Write}};

fn bin_search(arr: &Vec<i64>, target: i64) -> bool {
    let mut mid_index = arr.len() / 2;
    let mut lhs = 0;
    let mut rhs = arr.len() - 1;
    let mut mid_value = arr[mid_index];

    while lhs <= rhs {
        match mid_value.cmp(&target) {
            Ordering::Equal => return true,
            Ordering::Less => lhs = mid_index + 1,
            Ordering::Greater => rhs = mid_index - 1,
        }

        mid_index = (lhs + rhs) / 2;
        mid_value = arr[mid_index];
    }

    return false;
}

pub fn main() {
    let _ = io::stdin()
                .lock()
                .lines()
                .next()
                .unwrap()
                .unwrap()
                .parse::<usize>()
                .unwrap();

    let mut a = io::stdin()
                .lock()
                .lines()
                .next()
                .unwrap()
                .unwrap()
                .split_whitespace()
                .map(|s| s.parse::<i64>().unwrap())
                .collect::<Vec<i64>>();

    a.sort_unstable();

    let _ = io::stdin()
                .lock()
                .lines()
                .next()
                .unwrap()
                .unwrap()
                .parse::<usize>()
                .unwrap();

    let validators = io::stdin()
                .lock()
                .lines()
                .next()
                .unwrap()
                .unwrap()
                .split_whitespace()
                .map(|s| bin_search(&a, s.parse::<i64>().unwrap()))
                .collect::<Vec<bool>>();

    let mut writer = BufWriter::new(io::stdout());
    for v in validators {
        if v { writer.write(b"1\n").unwrap(); } else { writer.write(b"0\n").unwrap(); }
    }

    writer.flush().unwrap();
}