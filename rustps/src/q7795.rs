use std::{cmp::Ordering, io::{self, BufWriter, Write}};

macro_rules! print_fast {
    ($($arg:tt)*) => {
        let mut writer = BufWriter::new(io::stdout());
        writer.write(format!($($arg)*).as_bytes()).unwrap();
        writer.flush().unwrap();
    }
}

fn input() -> String {
    io::stdin().lines().next().unwrap().unwrap()
}

pub fn main() {
    let t = input().parse::<usize>().unwrap();

    for _ in 0..t {
        let (n, m) = {
            let s = input();
            let (a, b) = s.split_once(' ').unwrap();
            (a.parse::<usize>().unwrap(), b.parse::<usize>().unwrap())
        };

        let a = input().split(' ')
                                .map(|s| s.parse::<i32>().unwrap())
                                .collect::<Vec<i32>>();

        let mut b = input().split(' ')
                                .map(|s| s.parse::<i32>().unwrap())
                                .collect::<Vec<i32>>();

        b.sort_unstable();
        let mut res = 0;
        
        for i in 0..n {
            let target = a[i];
            let mut lhs = 0;
            let mut rhs = m - 1;

            while lhs <= rhs {
                let mid = lhs + (rhs - lhs) / 2;
                match b[mid].cmp(&target) {
                    Ordering::Less => {
                        if mid == 0 {res += 1;} else {res += mid;}
                        lhs = mid + 1;
                    },
                    Ordering::Equal => {
                        if mid == 0 {res += 1;} else {res += mid;}
                        lhs = mid + 1;
                    },
                    Ordering::Greater => {
                        if mid == 0 {
                            break;
                        }
                        rhs = mid - 1;
                    },
                }
            }
        }

        print_fast!("{}\n", res);
    }
}